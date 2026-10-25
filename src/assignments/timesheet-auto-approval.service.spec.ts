import { EventsGateway } from '../events/events.gateway';
import { PrismaService } from '../prisma.service';
import { TimesheetAutoApprovalService } from './timesheet-auto-approval.service';

describe('TimesheetAutoApprovalService', () => {
  const dueTimesheet = {
    id: 'timesheet-1',
    assignment: {
      serviceRequest: { userId: 'customer-1' },
      worker: { userId: 'worker-1' },
    },
  };
  const prisma = {
    timesheet: { findMany: jest.fn(), updateMany: jest.fn() },
  };
  const events = { notify: jest.fn().mockResolvedValue(undefined) };
  const service = new TimesheetAutoApprovalService(
    prisma as unknown as PrismaService,
    events as unknown as EventsGateway,
  );

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-26T12:00:00.000Z'));
    jest.clearAllMocks();
    prisma.timesheet.findMany.mockResolvedValue([dueTimesheet]);
    prisma.timesheet.updateMany.mockResolvedValue({ count: 1 });
    events.notify.mockResolvedValue(undefined);
  });

  afterEach(() => jest.useRealTimers());

  it('auto-approves only pending sheets at least 24 hours old', async () => {
    await expect(service.approveExpiredTimesheets()).resolves.toBe(1);

    expect(prisma.timesheet.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        status: 'PENDING_APPROVAL',
        submittedAt: { lte: new Date('2026-10-25T12:00:00.000Z') },
      },
    }));
    expect(prisma.timesheet.updateMany).toHaveBeenCalledWith({
      where: {
        id: dueTimesheet.id,
        status: 'PENDING_APPROVAL',
        submittedAt: { lte: new Date('2026-10-25T12:00:00.000Z') },
      },
      data: { status: 'APPROVED', approvedAt: new Date('2026-10-26T12:00:00.000Z') },
    });
    expect(events.notify).toHaveBeenCalledTimes(2);
  });

  it('does not overwrite a timesheet that was disputed before the claim', async () => {
    prisma.timesheet.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.approveExpiredTimesheets()).resolves.toBe(0);

    expect(events.notify).not.toHaveBeenCalled();
  });
});