import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AssignmentsService } from './assignments.service';

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AssignmentsController {
  constructor(private svc: AssignmentsService) {}

  @Get('assignments/mine')
  mine(@Req() req: any) {
    return this.svc.mine(req.user);
  }

  @Get('assignments/:id')
  get(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(req.user, id);
  }

  @Post('assignments/:id/en-route')
  @Roles('WORKER')
  enRoute(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.progress(req.user, id, 'EN_ROUTE');
  }

  @Post('assignments/:id/arrived')
  @Roles('WORKER')
  arrived(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.progress(req.user, id, 'ARRIVED');
  }

  @Post('assignments/:id/start-otp')
  @Roles('USER')
  startOtp(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.issueOtp(req.user, id, 'start');
  }

  @Post('assignments/:id/start')
  @Roles('WORKER')
  start(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.svc.verify(req.user, id, 'start', body);
  }

  @Post('assignments/:id/end-otp')
  @Roles('USER')
  endOtp(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.issueOtp(req.user, id, 'end');
  }

  @Post('assignments/:id/end')
  @Roles('WORKER')
  end(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() body: any) {
    return this.svc.verify(req.user, id, 'end', body);
  }

  @Get('assignments/:id/timesheet')
  timesheet(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.timesheet(req.user, id);
  }

  @Post('timesheets/:id/approve')
  @Roles('USER')
  approve(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.approve(req.user, id);
  }
}