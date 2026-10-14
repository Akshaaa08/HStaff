import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { PaymentsService } from './payments.service';
import { PayDto } from '../common/dto';

@Controller('payments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class PaymentsController {
  constructor(private svc: PaymentsService) {}

  @Post()
  @Roles('USER')
  pay(@Req() req: any, @Body() body: PayDto) {
    return this.svc.pay(req.user.userId, body);
  }

  @Get(':timesheetId')
  @Roles('USER', 'WORKER')
  get(@Req() req: any, @Param('timesheetId', ParseUUIDPipe) id: string) {
    return this.svc.get(req.user.userId, id);
  }
}