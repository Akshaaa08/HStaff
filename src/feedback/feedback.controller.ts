import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuditService } from '../audit/audit.service';
import { FeedbackService } from './feedback.service';

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FeedbackController {
  constructor(private svc: FeedbackService, private audit: AuditService) {}

  @Post('ratings')
  @Roles('USER', 'WORKER')
  rate(@Req() req: any, @Body() body: any) {
    return this.svc.rate(req.user.userId, body);
  }

  @Post('complaints')
  @Roles('USER', 'WORKER')
  complain(@Req() req: any, @Body() body: any) {
    return this.svc.complain(req.user.userId, body);
  }

  @Get('admin/complaints')
  @Roles('ADMIN')
  list() {
    return this.svc.listComplaints();
  }

  @Patch('admin/complaints/:id')
  @Roles('ADMIN')
  async resolve(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const c = await this.svc.resolve(id, body);
    await this.audit.log(req.user.userId, 'COMPLAINT_' + c.status, 'Complaint', id, {
      resolution: c.resolution,
    });
    return c;
  }
}