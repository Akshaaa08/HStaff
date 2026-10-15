import { Module } from '@nestjs/common';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { OffersExpiryService } from './offers-expiry.service';

@Module({
  controllers: [OffersController],
  providers: [OffersService, OffersExpiryService],
})
export class OffersModule {}