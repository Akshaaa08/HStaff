import { Body, Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma.service';
import { AuditService } from '../audit/audit.service';

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
    @Param('id') id: string,
    @Body() body: { status: 'VERIFIED' | 'REJECTED' },
  ) {
    const w = await this.prisma.workerProfile.update({
      where: { id },
      data: { verificationStatus: body.status },
    });
    await this.audit.log(req.user.userId, 'WORKER_' + body.status, 'WorkerProfile', id);
    return w;
  }

  @Get('audit-logs')
  auditLogs() {
    return this.audit.list();
  }
}