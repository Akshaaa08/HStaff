import { AdminController } from './admin.controller';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma.service';

describe('AdminController timesheet dispute resolution', () => {
  const prisma = {
    timesheet: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  };
  const audit = { log: jest.fn().mockResolvedValue(undefined) };
  const controller = new AdminController(
    prisma as unknown as PrismaService,
    audit as unknown as AuditService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.timesheet.findUnique
      .mockResolvedValueOnce({ id: 'timesheet-1', status: 'DISPUTED' })
      .mockResolvedValueOnce({ id: 'timesheet-1', status: 'REJECTED' });
    prisma.timesheet.updateMany.mockResolvedValue({ count: 1 });
  });

  it('records a rejected resolution and audits it', async () => {
    const result = await controller.resolveTimesheetDispute(
      { user: { userId: 'admin-1' } },
      'timesheet-1',
      { status: 'REJECTED', resolution: 'Hours were not supported by attendance.' },
    );

    expect(prisma.timesheet.updateMany).toHaveBeenCalledWith({
      where: { id: 'timesheet-1', status: 'DISPUTED' },
      data: expect.objectContaining({
        status: 'REJECTED',
        resolvedBy: 'admin-1',
        resolution: 'Hours were not supported by attendance.',
      }),
    });
    expect(audit.log).toHaveBeenCalledWith(
      'admin-1', 'TIMESHEET_DISPUTE_REJECTED', 'Timesheet', 'timesheet-1',
      { resolution: 'Hours were not supported by attendance.' },
    );
    expect(result?.status).toBe('REJECTED');
  });
});