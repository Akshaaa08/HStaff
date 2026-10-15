import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateStatusDto, VerifyOtpDto } from './dto/update-status.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../common/interfaces/current-user.interface.js';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(user, dto);
  }

  @Get()
  async findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
  ) {
    return this.bookingsService.findAll(user, status);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.bookingsService.findById(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, dto.status, user);
  }

  @Post(':id/start-otp')
  async verifyStartOtp(
    @Param('id') id: string,
    @Body() dto: VerifyOtpDto,
  ) {
    return this.bookingsService.verifyStartOtp(id, dto.code);
  }

  @Post(':id/end-otp')
  async verifyEndOtp(
    @Param('id') id: string,
    @Body() dto: VerifyOtpDto,
  ) {
    return this.bookingsService.verifyEndOtp(id, dto.code);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.bookingsService.cancel(id);
  }
}
