import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { WorkersService } from './workers.service';

@Controller('workers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('WORKER')
export class WorkersController {
  constructor(private workers: WorkersService) {}

  @Get('me')
  getMe(@Req() req: any) {
    return this.workers.getMe(req.user.userId);
  }

  @Put('me')
  updateMe(@Req() req: any, @Body() body: any) {
    return this.workers.upsertMe(req.user.userId, body);
  }

  @Get('availability')
  getAvailability(@Req() req: any) {
    return this.workers.getAvailability(req.user.userId);
  }

  @Put('availability')
  setAvailability(@Req() req: any, @Body() body: { slots: any[] }) {
    return this.workers.setAvailability(req.user.userId, body.slots);
  }

  @Post('me/submit')
  submit(@Req() req: any) {
    return this.workers.submitForReview(req.user.userId);
  }
}