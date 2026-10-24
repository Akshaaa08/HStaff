import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { PaymentGateway } from './payment-gateway';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
    private gateway: PaymentGateway,
  ) {}

  // Mock gateway: succeeds unless simulateFail is true.
  async pay(userId: string, body: { timesheetId: string; simulateFail?: boolean }) {
    const t = await this.prisma.timesheet.findUnique({
      where: { id: body.timesheetId },
      include: { assignment: { include: { serviceRequest: true, worker: true } }, payment: true },
    });
    if (!t) throw new NotFoundException('Timesheet not found');
    if (t.assignment.serviceRequest.userId !== userId) throw new ForbiddenException('Not your timesheet');
    if (t.status !== 'APPROVED') throw new BadRequestException('Approve the timesheet before paying');
    if (t.payment?.status === 'SUCCEEDED') throw new BadRequestException('Already paid');
    if (t.payment?.status === 'REFUNDED') throw new BadRequestException('This payment was refunded');

    const ok = !body.simulateFail;
    const data = {
      amount: t.customerTotal, // worker amount + platform fee
      status: ok ? ('SUCCEEDED' as const) : ('FAILED' as const),
      gatewayRef: 'MOCK-' + Date.now(),
      paidAt: ok ? new Date() : null,
    };

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.upsert({
        where: { timesheetId: t.id },
        update: data,
        create: { timesheetId: t.id, ...data },
      });
      if (ok) {
        await tx.payout.create({
          data: { paymentId: payment.id, workerId: t.assignment.workerId, amount: t.grossWorkerAmount },
        });
      }
      return {
        ...payment,
        breakdown: { workerAmount: t.grossWorkerAmount, platformFee: t.platformFee, total: t.customerTotal },
      };
    });

    await this.events.notify(
      t.assignment.worker.userId,
      'PAYMENT_UPDATED',
      ok ? 'Payment received' : 'Payment failed',
      ok ? 'Your payout is being processed.' : 'The customer payment failed.',
      { timesheetId: t.id },
    );
    return result;
  }

  async get(userId: string, timesheetId: string) {
    const p = await this.prisma.payment.findUnique({
      where: { timesheetId },
      include: { timesheet: { include: { assignment: { include: { serviceRequest: true, worker: true } } } } },
    });
    if (!p) throw new NotFoundException('No payment yet');
    const a = p.timesheet.assignment;
    if (a.serviceRequest.userId !== userId && a.worker.userId !== userId) throw new ForbiddenException();
    const { timesheet, ...payment } = p;
    return payment;
  }

  // ADMIN: refund a payment, fully or partially.
  async refund(adminId: string, paymentId: string, body: { amount?: number; reason: string }) {
    const p = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        payout: true,
        timesheet: { include: { assignment: { include: { serviceRequest: true, worker: true } } } },
      },
    });
    if (!p) throw new NotFoundException('Payment not found');
    if (p.status !== 'SUCCEEDED') {
      throw new BadRequestException(`Only a SUCCEEDED payment can be refunded (this one is ${p.status})`);
    }
    if (p.payout && (p.payout.status === 'SETTLED' || p.payout.status === 'PROCESSING')) {
      throw new BadRequestException(`Payout is already ${p.payout.status}, refund is not allowed`);
    }

    const remaining = p.amount - p.refundedAmount;
    const amount = body.amount ?? remaining;
    if (amount < 1 || amount > remaining) {
      throw new BadRequestException(`Refund must be between 1 and ${remaining}`);
    }
    const totalRefunded = p.refundedAmount + amount;
    const full = totalRefunded === p.amount;

    const { ref, payment } = await this.prisma.$transaction(async (tx) => {
      // Lock: fails if another refund changed this payment a moment ago.
      const locked = await tx.payment.updateMany({
        where: { id: p.id, status: 'SUCCEEDED', refundedAmount: p.refundedAmount },
        data: {
          refundedAmount: totalRefunded,
          refundReason: body.reason,
          refundedAt: new Date(),
          status: full ? 'REFUNDED' : 'SUCCEEDED',
        },
      });
      if (locked.count === 0) throw new ConflictException('Payment changed, please try again');

      // If the gateway fails, this throws and the database changes roll back.
      //const { ref } = await this.gateway.refund(p.gatewayRef, amount);

        // The refund comes out of the worker's pending payout.
      if (p.payout) {
        const left = Math.max(0, p.payout.amount - amount);
        const res = await tx.payout.updateMany({
          where: { id: p.payout.id, status: 'PENDING' },
          data: left === 0 ? { amount: 0, status: 'REFUNDED' as const } : { amount: left },
        });
        if (res.count === 0) throw new ConflictException('Payout is no longer pending');
      }

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: full ? 'PAYMENT_REFUNDED' : 'PAYMENT_PARTIALLY_REFUNDED',
          entityType: 'Payment',
          entityId: p.id,
                    metadata: { amount, reason: body.reason },
        },
      });

           const payment = await tx.payment.findUniqueOrThrow({ where: { id: p.id } });
      // Gateway goes last: if it fails, everything above rolls back.
     const { ref } = await this.gateway.refund(p.gatewayRef, amount, `${p.id}:${totalRefunded}`);
      return { ref, payment };
    }, { timeout: 15000 });

       const a = p.timesheet.assignment;
    try {
      await this.events.notify(a.serviceRequest.userId, 'PAYMENT_REFUNDED', 'Refund issued',
        `Rs ${amount} was refunded to you.`, { paymentId: p.id });
      await this.events.notify(a.worker.userId, 'PAYMENT_REFUNDED', 'Payment refunded',
        'A refund was issued on one of your jobs. Your payout was adjusted.', { paymentId: p.id });
    } catch {
      // The refund already went through, so a notification failure must not turn it into an error.
    }

    return { ...payment, refundRef: ref };
  }
}