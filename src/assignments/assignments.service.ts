import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

const MAX_DISTANCE_M = 300; // worker must be within 300 m of the job
const OTP_MINUTES = 15;
const MIN_BILLED_HOURS = 1; // minimum billing, rounded up in 15-minute steps after that

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService, private events: EventsGateway) {}

  private async load(id: string) {
    const a = await this.prisma.assignment.findUnique({
      where: { id },
      include: { serviceRequest: true, worker: true, timesheet: true },
    });
    if (!a) throw new NotFoundException('Assignment not found');
    return a;
  }

  private assertAccess(a: any, user: any) {
    const ok =
      user.role === 'USER'
        ? a.serviceRequest.userId === user.userId
        : a.worker.userId === user.userId;
    if (!ok) throw new ForbiddenException('Not your assignment');
  }

  async mine(user: any) {
    const where =
      user.role === 'USER'
        ? { serviceRequest: { userId: user.userId } }
        : { worker: { userId: user.userId } };
    return this.prisma.assignment.findMany({
      where,
      include: { serviceRequest: true, timesheet: true },
      orderBy: { acceptedAt: 'desc' },
    });
  }

  async get(user: any, id: string) {
    const a = await this.load(id);
    this.assertAccess(a, user);
    // Do not leak the worker's exact location or private data.
    return {
      ...a,
      worker: {
        id: a.worker.id,
        experienceYears: a.worker.experienceYears,
        baseHourlyRate: a.worker.baseHourlyRate,
        profileImageUrl: a.worker.profileImageUrl,
      },
    };
  }

  // WORKER reports travel progress.
  async progress(user: any, id: string, to: 'EN_ROUTE' | 'ARRIVED') {
    const a = await this.load(id);
    if (a.worker.userId !== user.userId) throw new ForbiddenException('Not your assignment');
    const from = to === 'EN_ROUTE' ? ['CONFIRMED'] : ['EN_ROUTE'];
    if (!from.includes(a.status)) {
      throw new BadRequestException(`Assignment is ${a.status}, expected ${from.join(' or ')}`);
    }
    const updated = await this.prisma.assignment.update({ where: { id }, data: { status: to } });
    await this.events.notify(
      a.serviceRequest.userId,
      to === 'EN_ROUTE' ? 'WORKER_EN_ROUTE' : 'WORKER_ARRIVED',
      to === 'EN_ROUTE' ? 'Worker is on the way' : 'Worker has arrived',
      'Please share the start OTP.',
      { assignmentId: id },
    );
    return updated;
  }

  // USER generates an OTP and tells the worker in person.
  async issueOtp(user: any, id: string, kind: 'start' | 'end') {
    const a = await this.load(id);
    if (a.serviceRequest.userId !== user.userId) throw new ForbiddenException('Not your assignment');
    const allowed = kind === 'start' ? ['CONFIRMED', 'EN_ROUTE', 'ARRIVED'] : ['IN_PROGRESS'];
    if (!allowed.includes(a.status)) {
      throw new BadRequestException(`Assignment is ${a.status}, expected ${allowed.join(' or ')}`);
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const hash = await bcrypt.hash(otp, 10);
    const expires = new Date(Date.now() + OTP_MINUTES * 60_000);
    const data =
      kind === 'start'
        ? { startOtpHash: hash, startOtpExpiresAt: expires }
        : { endOtpHash: hash, endOtpExpiresAt: expires };
    await this.prisma.attendanceSession.upsert({
      where: { assignmentId: a.id },
      update: data,
      create: { assignmentId: a.id, ...data },
    });
    return { otp, expiresInMinutes: OTP_MINUTES };
  }

  // WORKER enters the OTP, with GPS coordinates.
  async verify(user: any, id: string, kind: 'start' | 'end', body: any) {
    const a = await this.load(id);
    if (a.worker.userId !== user.userId) throw new ForbiddenException('Not your assignment');
    const allowed = kind === 'start' ? ['CONFIRMED', 'EN_ROUTE', 'ARRIVED'] : ['IN_PROGRESS'];
    if (!allowed.includes(a.status)) {
      throw new BadRequestException(`Assignment is ${a.status}, expected ${allowed.join(' or ')}`);
    }

    const { otp, latitude, longitude } = body ?? {};
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new BadRequestException('latitude and longitude are required');
    }
    const dist = distanceMeters(
      latitude, longitude, a.serviceRequest.latitude, a.serviceRequest.longitude,
    );
    if (dist > MAX_DISTANCE_M) {
      throw new BadRequestException(
        `You are ${Math.round(dist)} m from the service location (max ${MAX_DISTANCE_M} m)`,
      );
    }

    const session = await this.prisma.attendanceSession.findUnique({ where: { assignmentId: a.id } });
    const hash = kind === 'start' ? session?.startOtpHash : session?.endOtpHash;
    const exp = kind === 'start' ? session?.startOtpExpiresAt : session?.endOtpExpiresAt;
    if (!session || !hash || !exp || exp < new Date()) {
      throw new BadRequestException('No valid OTP. Ask the customer to generate a new one.');
    }
    if (!(await bcrypt.compare(String(otp), hash))) {
      throw new BadRequestException('Wrong OTP');
    }

    const now = new Date();

    if (kind === 'start') {
      await this.prisma.$transaction([
        this.prisma.attendanceSession.update({
          where: { assignmentId: a.id },
          data: { startAt: now, startLat: latitude, startLng: longitude, startOtpHash: null, startOtpExpiresAt: null },
        }),
        this.prisma.assignment.update({
          where: { id: a.id },
          data: { status: 'IN_PROGRESS', startedAt: now },
        }),
      ]);
      await this.events.notify(a.serviceRequest.userId, 'SERVICE_STARTED', 'Service started',
        'Your service has begun.', { assignmentId: a.id });
      return { status: 'IN_PROGRESS', startedAt: now };
    }

    // END: close the session and generate the timesheet.
    const startedAt = a.startedAt ?? now;
    const minutes = (now.getTime() - startedAt.getTime()) / 60000;
    const verifiedHours = Math.max(MIN_BILLED_HOURS, Math.ceil(minutes / 15) * 0.25);
    const gross = Math.round(verifiedHours * a.agreedHourlyRate);
    const fee = Math.round(verifiedHours * a.platformFee);

    const result = await this.prisma.$transaction([
      this.prisma.attendanceSession.update({
        where: { assignmentId: a.id },
        data: { endAt: now, endLat: latitude, endLng: longitude, endOtpHash: null, endOtpExpiresAt: null },
      }),
      this.prisma.assignment.update({
        where: { id: a.id },
        data: { status: 'COMPLETED', completedAt: now },
      }),
      this.prisma.timesheet.create({
        data: {
          assignmentId: a.id,
          verifiedHours,
          hourlyRate: a.agreedHourlyRate,
          grossWorkerAmount: gross,
          platformFee: fee,
          customerTotal: gross + fee,
        },
      }),
    ]);
    await this.events.notify(a.serviceRequest.userId, 'SERVICE_COMPLETED', 'Service completed',
      'Please approve the timesheet.', { assignmentId: a.id });
    return result[2];
  }

  async timesheet(user: any, id: string) {
    const a = await this.load(id);
    this.assertAccess(a, user);
    if (!a.timesheet) throw new NotFoundException('No timesheet yet');
    return a.timesheet;
  }

  // USER approves the timesheet.
  async approve(user: any, timesheetId: string) {
    const t = await this.prisma.timesheet.findUnique({
      where: { id: timesheetId },
      include: { assignment: { include: { serviceRequest: true } } },
    });
    if (!t) throw new NotFoundException('Timesheet not found');
    if (t.assignment.serviceRequest.userId !== user.userId) throw new ForbiddenException('Not your timesheet');
    if (t.status !== 'PENDING_APPROVAL') throw new BadRequestException(`Timesheet is already ${t.status}`);
    return this.prisma.timesheet.update({
      where: { id: t.id },
      data: { status: 'APPROVED', approvedAt: new Date() },
    });
  }
}