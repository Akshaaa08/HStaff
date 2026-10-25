import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

const REVIEW_WINDOW_HOURS = 24;

@Injectable()
export class TimesheetAutoApprovalService {
  private readonly log = new Logger(TimesheetAutoApprovalService.name);

  constructor(private prisma: PrismaService, private events: EventsGateway) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async approveExpiredTimesheets() {
    const now = new Date();
    const cutoff = new Date(now.getTime() - REVIEW_WINDOW_HOURS * 60 * 60 * 1000);
    const due = await this.prisma.timesheet.findMany({
      where: { status: 'PENDING_APPROVAL', submittedAt: { lte: cutoff } },
      include: {
        assignment: {
          include: {
            serviceRequest: { select: { userId: true } },
            worker: { select: { userId: true } },
          },
        },
      },
      take: 100,
    });

    let approved = 0;
    for (const timesheet of due) {
      const result = await this.prisma.timesheet.updateMany({
        where: { id: timesheet.id, status: 'PENDING_APPROVAL', submittedAt: { lte: cutoff } },
        data: { status: 'APPROVED', approvedAt: now },
      });
      if (result.count === 0) continue;
      approved++;

      const assignment = timesheet.assignment;
      try {
        await Promise.all([
          this.events.notify(assignment.serviceRequest.userId, 'TIMESHEET_AUTO_APPROVED', 'Timesheet approved',
            'The 24-hour review window ended without a dispute.', { timesheetId: timesheet.id }),
          this.events.notify(assignment.worker.userId, 'TIMESHEET_AUTO_APPROVED', 'Timesheet approved',
            'Your timesheet was approved after the 24-hour review window.', { timesheetId: timesheet.id }),
        ]);
      } catch {
        // Approval is committed; notification failures must not undo it.
      }
    }

    if (approved > 0) this.log.log(`Auto-approved ${approved} timesheet(s)`);
    return approved;
  }
}