import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// Ranking weights from the design document.
const W = { skill: 35, proximity: 25, availability: 20, rating: 10, experience: 10 };

@Injectable()
export class ServiceRequestsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, body: any) {
    return this.prisma.serviceRequest.create({
      data: {
        userId,
        categoryId: body.categoryId,
        bookingMode: body.bookingMode ?? 'INSTANT',
        startAt: body.startAt ? new Date(body.startAt) : new Date(),
        durationHours: body.durationHours ?? 1,
        latitude: body.latitude,
        longitude: body.longitude,
        address: body.address,
        notes: body.notes,
        skillIds: body.skillIds ?? [],
      },
    });
  }

  list(userId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(userId: string, id: string) {
    const req = await this.prisma.serviceRequest.findFirst({ where: { id, userId } });
    if (!req) throw new NotFoundException('Request not found');
    return req;
  }

  async findWorkers(userId: string, id: string) {
    const req = await this.get(userId, id);

    // Work out the requested time window (Indian Standard Time for day and hour checks).
    const reqStart = req.startAt;
    const reqEnd = new Date(reqStart.getTime() + req.durationHours * 3600_000);
    const ist = new Date(reqStart.getTime() + 330 * 60_000);
    const dow = ist.getUTCDay();
    const startMin = ist.getUTCHours() * 60 + ist.getUTCMinutes();
    const endMin = startMin + req.durationHours * 60;
    const skillIds = req.skillIds ?? [];

    // Hard filters in SQL: verified, category, radius, no overlapping job,
    // and inside the worker's weekly hours (if the worker has set any).
    const rows: any[] = await this.prisma.$queryRaw`
      SELECT * FROM (
        SELECT
          w.id,
          u.name,
          w."baseHourlyRate",
          w."experienceYears",
          w."serviceRadiusKm",
          ROUND((ST_Distance(
            ST_SetSRID(ST_MakePoint(w."longitude", w."latitude"), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${req.longitude}::float8, ${req.latitude}::float8), 4326)::geography
          ) / 1000)::numeric, 1) AS "distanceKm",
          (SELECT COALESCE(AVG(r."score"), 0) FROM "Rating" r WHERE r."rateeId" = w."userId")::float8 AS "avgRating",
          (SELECT COUNT(*) FROM "Rating" r WHERE r."rateeId" = w."userId")::int AS "ratingCount",
          (SELECT COUNT(*) FROM "WorkerSkill" ws
             WHERE ws."workerId" = w.id AND ws."skillId" = ANY(${skillIds}::int[]))::int AS "skillMatches",
          EXISTS (SELECT 1 FROM "WorkerAvailability" a
             WHERE a."workerId" = w.id AND a.active) AS "hasSlots",
          EXISTS (SELECT 1 FROM "WorkerAvailability" a
             WHERE a."workerId" = w.id AND a.active
               AND a."dayOfWeek" = ${dow}::int
               AND a."startMinute" <= ${startMin}::int
               AND a."endMinute" >= ${endMin}::int) AS "slotMatch"
        FROM "WorkerProfile" w
        JOIN "User" u ON u.id = w."userId"
        JOIN "WorkerCategory" wc ON wc."workerId" = w.id
        WHERE w."verificationStatus" = 'VERIFIED'
          AND wc."categoryId" = ${req.categoryId}
          AND w."latitude" IS NOT NULL
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(w."longitude", w."latitude"), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${req.longitude}::float8, ${req.latitude}::float8), 4326)::geography,
            w."serviceRadiusKm" * 1000
          )
          AND NOT EXISTS (
            SELECT 1 FROM "Assignment" asg
            JOIN "ServiceRequest" sr ON sr.id = asg."serviceRequestId"
            WHERE asg."workerId" = w.id
              AND asg.status IN ('CONFIRMED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS')
              AND sr."startAt" < ${reqEnd}::timestamp
              AND sr."startAt" + (sr."durationHours" * INTERVAL '1 hour') > ${reqStart}::timestamp
          )
      ) t
      WHERE (NOT t."hasSlots") OR t."slotMatch"
      ORDER BY t."distanceKm" ASC
      LIMIT 20
    `;

    return rows
      .map((r) => {
        const distanceKm = Number(r.distanceKm);
        const parts = {
          skill: skillIds.length ? r.skillMatches / skillIds.length : 1,
          proximity: Math.max(0, 1 - distanceKm / r.serviceRadiusKm),
          availability: r.hasSlots ? 1 : 0.5, // 0.5 when the worker has not set a schedule
          rating: r.ratingCount ? r.avgRating / 5 : 0.6, // neutral until rated
          experience: Math.min(r.experienceYears, 10) / 10,
        };
        const score =
          parts.skill * W.skill +
          parts.proximity * W.proximity +
          parts.availability * W.availability +
          parts.rating * W.rating +
          parts.experience * W.experience;
        return {
          id: r.id,
          name: r.name,
          baseHourlyRate: r.baseHourlyRate,
          experienceYears: r.experienceYears,
          serviceRadiusKm: r.serviceRadiusKm,
          distanceKm,
          ratingAverage: r.ratingCount ? Number(r.avgRating.toFixed(1)) : null,
          ratingCount: r.ratingCount,
          score: Math.round(score * 10) / 10,
          breakdown: {
            skill: Math.round(parts.skill * W.skill * 10) / 10,
            proximity: Math.round(parts.proximity * W.proximity * 10) / 10,
            availability: Math.round(parts.availability * W.availability * 10) / 10,
            rating: Math.round(parts.rating * W.rating * 10) / 10,
            experience: Math.round(parts.experience * W.experience * 10) / 10,
          },
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}