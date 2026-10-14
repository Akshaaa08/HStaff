import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateServiceRequestDto } from '../common/dto';
import { ServiceRequestsService } from './service-requests.service';

@Controller('service-requests')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('USER')
export class ServiceRequestsController {
  constructor(private svc: ServiceRequestsService) {}

  @Post()
  create(@Req() req: any, @Body() body: CreateServiceRequestDto) {
    return this.svc.create(req.user.userId, body);
  }

  @Get()
  list(@Req() req: any) {
    return this.svc.list(req.user.userId);
  }

  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.svc.get(req.user.userId, id);
  }

  @Get(':id/workers')
  workers(@Req() req: any, @Param('id') id: string) {
    return this.svc.findWorkers(req.user.userId, id);
  }
}