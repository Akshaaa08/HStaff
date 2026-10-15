import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { ProcessPaymentDto } from './dto/process-payment.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../common/interfaces/current-user.interface.js';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async processPayment(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ProcessPaymentDto,
  ) {
    return this.paymentsService.processPayment(user, dto);
  }

  @Get('booking/:bookingId')
  async getPaymentForBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.getPaymentForBooking(bookingId);
  }
}
