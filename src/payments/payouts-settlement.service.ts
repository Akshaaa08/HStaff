import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { PaymentGateway } from './payment-gateway';

@Injectable()
export class PayoutsSettlementService {
  private readonly log = new Logger(PayoutsSettlementService.name);

  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
    private gateway: PaymentGateway,
  ) {}

  // Every minute: pay out workers whose hold period is over.
  @Cron(CronExpression.EVERY_MINUTE)
  async settleDuePayouts() {
    const holdHours = Number(process.env.PAYOUT_HOLD_HOURS ?? 24);
    const cutoff = new Date(Date.now() - holdHours * 3_600_000);

    const due = await this.prisma.payout.findMany({
      where: {
        status: 'PENDING',
        amount: { gt: 0 },
        payment: {
          status: 'SUCCEEDED',
          paidAt: { lt: cutoff },
          // skip jobs that still have an open complaint
          timesheet: {
            assignment: {
              complaints: { none: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } },
            },
          },
        },
      },
      include: { worker: { select: { userId: true } } },
      take: 50,
    });

    let settled = 0;
    for (const payout of due) {
      // Claim it first, so two runs can never pay the same payout twice.
      const claimed = await this.prisma.payout.updateMany({
        where: { id: payout.id, status: 'PENDING' },
        data: { status: 'PROCESSING' },
      });
      if (claimed.count === 0) continue;

      let ref: string;
      try {
        ({ ref } = await this.gateway.payout(payout.workerId, payout.amount, payout.id));
      } catch (err) {
        // Gateway failed, so no money moved: safe to retry next run.
        await this.prisma.payout.update({ where: { id: payout.id }, data: { status: 'PENDING' } });
        this.log.error(`Payout ${payout.id} failed: ${(err as Error).message}`);
        continue;
      }

      // Money has moved. Never put this back to PENDING.
      await this.prisma.payout.update({
        where: { id: payout.id },
        data: { status: 'SETTLED', settledAt: new Date(), gatewayRef: ref },
      });
      try {
        await this.events.notify(payout.worker.userId, 'PAYOUT_SETTLED', 'Payout sent',
          `Rs ${payout.amount} was sent to you.`, { payoutId: payout.id });
      } catch {
        // payout is done; ignore notification failure
      }
      settled++;
    }
    if (settled > 0) this.log.log(`Settled ${settled} payout(s)`);
  }
}