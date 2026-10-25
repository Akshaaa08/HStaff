import { BadRequestException } from '@nestjs/common';
import { EventsGateway } from '../events/events.gateway';
import { PrismaService } from '../prisma.service';
import { AssignmentsService } from './assignments.service';

describe('AssignmentsService timesheet review', () => {
  const user = { userId: 'customer-1', role: 'USER' };
  const timesheet = {
    id: 'timesheet-1',
    status: 'PENDING_APPROVAL',
    submittedAt: new Date(),
    assignment: { serviceRequest: { userId: user.userId } },
  };
  const prisma = {
    assignment: { findUnique: jest.fn() },
    timesheet: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    attendanceSession: { upsert: jest.fn(), updateMany: jest.fn() },
    user: { findUnique: jest.fn() },
  };
  const events = { notify: jest.fn() };
  const sms = { send: jest.fn().mockResolvedValue(undefined) };
  const service = new AssignmentsService(
    prisma as unknown as PrismaService,
    events as unknown as EventsGateway,
    sms as any,
  );

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-26T12:00:00.000Z'));
    jest.clearAllMocks();
    prisma.timesheet.findUnique.mockResolvedValue(timesheet);
    prisma.timesheet.updateMany.mockResolvedValue({ count: 1 });
  });

  afterEach(() => jest.useRealTimers());

  it('allows customer approval inside the 24-hour window', async () => {
    const submittedAt = new Date('2026-10-25T12:00:01.000Z');
    prisma.timesheet.findUnique.mockResolvedValue({ ...timesheet, submittedAt });

    await service.approve(user, timesheet.id);

    expect(prisma.timesheet.updateMany).toHaveBeenCalledWith({
      where: {
        id: timesheet.id,
        status: 'PENDING_APPROVAL',
        submittedAt: { gt: new Date('2026-10-25T12:00:00.000Z') },
      },
      data: { status: 'APPROVED', approvedAt: new Date('2026-10-26T12:00:00.000Z') },
    });
  });

  it('rejects approval when the 24-hour window has elapsed', async () => {
    prisma.timesheet.findUnique.mockResolvedValue({
      ...timesheet,
      submittedAt: new Date('2026-10-25T12:00:00.000Z'),
    });
    prisma.timesheet.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.approve(user, timesheet.id)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('records a customer dispute within the window', async () => {
    await service.dispute(user, timesheet.id, 'Hours look incorrect');

    expect(prisma.timesheet.updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: timesheet.id, status: 'PENDING_APPROVAL' }),
      data: expect.objectContaining({ status: 'DISPUTED', disputeReason: 'Hours look incorrect' }),
    });
  });

  it('rejects disputes submitted at or after the deadline', async () => {
    prisma.timesheet.findUnique.mockResolvedValue({
      ...timesheet,
      submittedAt: new Date('2026-10-25T12:00:00.000Z'),
    });
    prisma.timesheet.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.dispute(user, timesheet.id, 'Late dispute')).rejects
      .toBeInstanceOf(BadRequestException);
  });

  it('sends job OTPs by SMS and does not return the code', async () => {
    prisma.assignment.findUnique.mockResolvedValue({
      id: 'assignment-1',
      status: 'ARRIVED',
      serviceRequest: { userId: user.userId },
      worker: { userId: 'worker-1' },
      timesheet: null,
    });
    prisma.user.findUnique.mockResolvedValue({ phone: '9876543210' });

    const result = await service.issueOtp(user, 'assignment-1', 'start');

    expect(sms.send).toHaveBeenCalledWith(
      '9876543210',
      expect.stringMatching(/^Your H-Staff start code is \d{6}\./),
    );
    expect(result).toEqual({ message: 'OTP sent by SMS', expiresInMinutes: 15 });
    expect(result).not.toHaveProperty('otp');
  });
});