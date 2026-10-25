import {
  BadRequestException, Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Req, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';
import { ResolveTimesheetDisputeDto, SetVerificationDto } from '../common/dto';

@Controller('admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  @Get('verifications')
  pending() {
    return this.prisma.workerProfile.findMany({
      where: { verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] } },
      include: { user: { select: { phone: true, name: true } } },
    });
  }

  @Patch('workers/:id/verification')
  async setStatus(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SetVerificationDto,
  ) {
    const w = await this.prisma.workerProfile.update({
      where: { id },
      data: { verificationStatus: body.status },
    });
    await this.audit.log(req.user.userId, 'WORKER_' + body.status, 'WorkerProfile', id);
    return w;
  }

  @Get('timesheets/disputed')
  disputedTimesheets() {
    return this.prisma.timesheet.findMany({
      where: { status: 'DISPUTED' },
      orderBy: { disputedAt: 'asc' },
      include: {
        assignment: { include: { serviceRequest: { include: { user: true } }, worker: { include: { user: true } } } },
      },
    });
  }

  @Patch('timesheets/:id/dispute')
  async resolveTimesheetDispute(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ResolveTimesheetDisputeDto,
  ) {
    const timesheet = await this.prisma.timesheet.findUnique({ where: { id } });
    if (!timesheet) throw new NotFoundException('Timesheet not found');
    if (timesheet.status !== 'DISPUTED') throw new BadRequestException('Timesheet is not disputed');
    const updated = await this.prisma.timesheet.updateMany({
      where: { id, status: 'DISPUTED' },
      data: {
        status: body.status,
        resolution: body.resolution,
        resolvedBy: req.user.userId,
        resolvedAt: new Date(),
        ...(body.status === 'APPROVED' ? { approvedAt: new Date() } : {}),
      },
    });
    if (updated.count === 0) throw new BadRequestException('Timesheet dispute was already resolved');
    const result = await this.prisma.timesheet.findUnique({ where: { id } });
    await this.audit.log(req.user.userId, `TIMESHEET_DISPUTE_${body.status}`, 'Timesheet', id, {
      resolution: body.resolution,
    });
    return result;
  }

  @Get('audit-logs')
  auditLogs() {
    return this.audit.list();
  }
}