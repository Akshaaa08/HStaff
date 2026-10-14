import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateOfferDto } from '../common/dto';
import { OffersService } from './offers.service';

@Controller('offers')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OffersController {
  constructor(private offers: OffersService) {}

  @Post()
  @Roles('USER')
  create(@Req() req: any, @Body() body: CreateOfferDto) {
    return this.offers.create(req.user.userId, body);
  }

  @Get('mine')
  @Roles('WORKER')
  mine(@Req() req: any) {
    return this.offers.listForWorker(req.user.userId);
  }

  @Post(':id/respond')
  @Roles('WORKER')
  respond(@Req() req: any, @Param('id') id: string, @Body() body: { accept: boolean }) {
    return this.offers.respond(req.user.userId, id, body.accept);
  }
}