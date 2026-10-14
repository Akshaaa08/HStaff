import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

function toMinute(t: string): number {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(t));
  if (!m) throw new BadRequestException('time must look like 09:30');
  return Number(m[1]) * 60 + Number(m[2]);
}

@Injectable()
export class WorkersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: {
        categories: { include: { category: true } },
        skills: { include: { skill: true } },
        availability: true,
      },
    });
    if (!profile) throw new NotFoundException('No worker profile yet');
    return profile;
  }

  async upsertMe(userId: string, body: any) {
    const data = {
      experienceYears: body.experienceYears,
      baseHourlyRate: body.baseHourlyRate,
      serviceRadiusKm: body.serviceRadiusKm,
      latitude: body.latitude,
      longitude: body.longitude,
      profileImageUrl: body.profileImageUrl,
    };
    const profile = await this.prisma.workerProfile.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });

    if (Array.isArray(body.categoryIds)) {
      await this.prisma.workerCategory.deleteMany({ where: { workerId: profile.id } });
      await this.prisma.workerCategory.createMany({
        data: body.categoryIds.map((categoryId: number) => ({ workerId: profile.id, categoryId })),
      });
    }
    if (Array.isArray(body.skillIds)) {
      await this.prisma.workerSkill.deleteMany({ where: { workerId: profile.id } });
      await this.prisma.workerSkill.createMany({
        data: body.skillIds.map((skillId: number) => ({ workerId: profile.id, skillId })),
      });
    }
    return this.getMe(userId);
  }

  // Replaces the worker's whole weekly schedule.
  async setAvailability(userId: string, slots: any[]) {
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('No worker profile yet');
    if (!Array.isArray(slots)) throw new BadRequestException('slots must be a list');

    const rows = slots.map((s) => {
      const day = Number(s.dayOfWeek);
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        throw new BadRequestException('dayOfWeek must be 0 (Sunday) to 6 (Saturday)');
      }
      const startMinute = toMinute(s.startTime);
      const endMinute = toMinute(s.endTime);
      if (endMinute <= startMinute) throw new BadRequestException('endTime must be after startTime');
      return { workerId: profile.id, dayOfWeek: day, startMinute, endMinute };
    });

    await this.prisma.$transaction([
      this.prisma.workerAvailability.deleteMany({ where: { workerId: profile.id } }),
      this.prisma.workerAvailability.createMany({ data: rows }),
    ]);
    return this.prisma.workerAvailability.findMany({ where: { workerId: profile.id } });
  }

  async getAvailability(userId: string) {
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('No worker profile yet');
    return this.prisma.workerAvailability.findMany({ where: { workerId: profile.id } });
  }

  async submitForReview(userId: string) {
    const profile = await this.getMe(userId);
    return this.prisma.workerProfile.update({
      where: { id: profile.id },
      data: { verificationStatus: 'UNDER_REVIEW' },
    });
  }
}