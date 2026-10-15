import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class OffersExpiryService {
  private readonly log = new Logger(OffersExpiryService.name);

  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  // Runs every minute: pending offers whose time ran out become EXPIRED
  @Cron(CronExpression.EVERY_MINUTE)
  async expireStaleOffers() {
    const stale = await this.prisma.workerOffer.findMany({
      where: { status: 'PENDING', expiresAt: { lt: new Date() } },
      include: { serviceRequest: { select: { userId: true } } },
      take: 100,
    });

    let expired = 0;
    for (const offer of stale) {
      // The status check stops us overwriting an offer accepted a moment ago
      const res = await this.prisma.workerOffer.updateMany({
        where: { id: offer.id, status: 'PENDING' },
        data: { status: 'EXPIRED' },
      });
      if (res.count === 0) continue;
      expired++;

      await this.events.notify(
        offer.serviceRequest.userId,
        'OFFER_EXPIRED',
        'Offer expired',
        'The worker did not respond in time. Please choose another worker.',
        { offerId: offer.id },
      );
    }

    if (expired > 0) this.log.log(`Expired ${expired} offer(s)`);
  }
}