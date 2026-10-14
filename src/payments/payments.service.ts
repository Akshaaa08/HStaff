import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService, private events: EventsGateway) {}

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
}