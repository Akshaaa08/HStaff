import { Logger } from '@nestjs/common';
import { EventsGateway } from '../events/events.gateway';
import { PrismaService } from '../prisma.service';
import { PaymentGateway } from './payment-gateway';
import { PayoutsSettlementService } from './payouts-settlement.service';

describe('PayoutsSettlementService', () => {
  const previousHoldHours = process.env.PAYOUT_HOLD_HOURS;
  const payout = {
    id: 'payout-1',
    workerId: 'worker-1',
    amount: 1200,
    worker: { userId: 'user-1' },
  };
  const prisma = {
    payout: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
  };
  const events = { notify: jest.fn() };
  const gateway = { payout: jest.fn() };
  let service: PayoutsSettlementService;

  beforeEach(() => {
    process.env.PAYOUT_HOLD_HOURS = '0';
    jest.clearAllMocks();
    prisma.payout.findMany.mockResolvedValue([payout]);
    prisma.payout.updateMany.mockResolvedValue({ count: 1 });
    prisma.payout.update.mockResolvedValue({});
    events.notify.mockResolvedValue(undefined);
    gateway.payout.mockResolvedValue({ ref: 'gateway-ref-1' });
    service = new PayoutsSettlementService(
      prisma as unknown as PrismaService,
      events as unknown as EventsGateway,
      gateway as unknown as PaymentGateway,
    );
  });

  afterAll(() => {
    if (previousHoldHours === undefined) delete process.env.PAYOUT_HOLD_HOURS;
    else process.env.PAYOUT_HOLD_HOURS = previousHoldHours;
  });

  it('settles due payouts using the payout ID as the idempotency key', async () => {
    await service.settleDuePayouts();

    expect(prisma.payout.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: 'PENDING',
        amount: { gt: 0 },
        payment: expect.objectContaining({
          status: 'SUCCEEDED',
          paidAt: { lt: expect.any(Date) },
          timesheet: expect.objectContaining({
            assignment: expect.objectContaining({
              complaints: { none: { status: { in: ['PENDING', 'UNDER_REVIEW'] } } },
            }),
          }),
        }),
      }),
    }));
    expect(prisma.payout.updateMany).toHaveBeenCalledWith({
      where: { id: payout.id, status: 'PENDING' },
      data: { status: 'PROCESSING' },
    });
    expect(gateway.payout).toHaveBeenCalledWith(payout.workerId, payout.amount, payout.id);
    expect(prisma.payout.update).toHaveBeenCalledWith({
      where: { id: payout.id },
      data: expect.objectContaining({ status: 'SETTLED', gatewayRef: 'gateway-ref-1' }),
    });
    expect(events.notify).toHaveBeenCalledWith(
      payout.worker.userId,
      'PAYOUT_SETTLED',
      'Payout sent',
      `Rs ${payout.amount} was sent to you.`,
      { payoutId: payout.id },
    );
  });

  it('returns failed payouts to PENDING so a later run can retry them', async () => {
    const logError = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    gateway.payout.mockRejectedValue(new Error('gateway unavailable'));

    await service.settleDuePayouts();

    expect(prisma.payout.update).toHaveBeenCalledWith({
      where: { id: payout.id },
      data: { status: 'PENDING' },
    });
    expect(events.notify).not.toHaveBeenCalled();
    logError.mockRestore();
  });

  it('does not call the gateway when another run already claimed the payout', async () => {
    prisma.payout.updateMany.mockResolvedValue({ count: 0 });

    await service.settleDuePayouts();

    expect(gateway.payout).not.toHaveBeenCalled();
    expect(prisma.payout.update).not.toHaveBeenCalled();
    expect(events.notify).not.toHaveBeenCalled();
  });
});