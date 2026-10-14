import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class OffersService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private events: EventsGateway,
  ) {}

  // USER sends an offer to one chosen worker
  async create(userId: string, body: { serviceRequestId: string; workerId: string }) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id: body.serviceRequestId, userId },
    });
    if (!request) throw new NotFoundException('Request not found');
    if (request.status !== 'OPEN' && request.status !== 'REQUESTED') {
      throw new BadRequestException(`Request is already ${request.status}`);
    }
    const worker = await this.prisma.workerProfile.findUnique({ where: { id: body.workerId } });
    if (!worker || worker.verificationStatus !== 'VERIFIED') {
      throw new BadRequestException('Worker is not available');
    }
    const offer = await this.prisma.workerOffer.create({
      data: {
        serviceRequestId: request.id,
        workerId: worker.id,
        offeredRate: worker.baseHourlyRate,
        expiresAt: new Date(Date.now() + 10 * 60_000), // 10-minute response window
      },
    });
    await this.prisma.serviceRequest.update({
      where: { id: request.id },
      data: { status: 'REQUESTED' },
    });
    await this.events.notify(worker.userId, 'WORKER_OFFER_RECEIVED', 'New job offer',
      'A customer chose you for a job.', { offerId: offer.id });
    return offer;
  }

  // WORKER lists pending offers
  async listForWorker(userId: string) {
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('No worker profile');
    return this.prisma.workerOffer.findMany({
      where: { workerId: profile.id, status: 'PENDING', expiresAt: { gt: new Date() } },
      include: {
        serviceRequest: {
          select: { categoryId: true, durationHours: true, startAt: true, address: true, notes: true },
        },
      },
    });
  }

  // WORKER accepts or declines
  async respond(userId: string, offerId: string, accept: boolean) {
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('No worker profile');

    const offer = await this.prisma.workerOffer.findUnique({ where: { id: offerId } });
    if (!offer || offer.workerId !== profile.id) throw new NotFoundException('Offer not found');
    if (offer.status !== 'PENDING') throw new BadRequestException(`Offer is already ${offer.status}`);
    if (offer.expiresAt < new Date()) {
      await this.prisma.workerOffer.update({ where: { id: offer.id }, data: { status: 'EXPIRED' } });
      throw new BadRequestException('Offer expired');
    }

    const sr = await this.prisma.serviceRequest.findUnique({ where: { id: offer.serviceRequestId } });

    if (!accept) {
      const declined = await this.prisma.workerOffer.update({
        where: { id: offer.id },
        data: { status: 'DECLINED', respondedAt: new Date() },
      });
      if (sr) {
        await this.events.notify(sr.userId, 'WORKER_DECLINED', 'Offer declined',
          'The worker declined. Please choose another worker.', { offerId: offer.id });
      }
      return declined;
    }

    // Accept: lock the request so two workers can't both win.
    const lockKey = `lock:request:${offer.serviceRequestId}`;
    const gotLock = await this.redis.acquireLock(lockKey);
    if (!gotLock) throw new ConflictException('Another acceptance is in progress, try again');

    try {
      const assignment = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.assignment.findUnique({
          where: { serviceRequestId: offer.serviceRequestId },
        });
        if (existing) throw new ConflictException('This request is already taken');

        await tx.workerOffer.update({
          where: { id: offer.id },
          data: { status: 'ACCEPTED', respondedAt: new Date() },
        });
        await tx.serviceRequest.update({
          where: { id: offer.serviceRequestId },
          data: { status: 'CONFIRMED' },
        });
        return tx.assignment.create({
          data: {
            serviceRequestId: offer.serviceRequestId,
            workerId: profile.id,
            agreedHourlyRate: offer.offeredRate,
          },
        });
      });
      if (sr) {
        await this.events.notify(sr.userId, 'BOOKING_CONFIRMED', 'Booking confirmed',
          'A worker accepted your request.', { assignmentId: assignment.id });
      }
      return assignment;
    } finally {
      await this.redis.releaseLock(lockKey);
    }
  }
}