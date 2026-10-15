import { Controller, Post, Body, Get, Patch, UseGuards, HttpCode, HttpStatus, Request } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { OtpRequestDto } from './dto/otp-request.dto.js';
import { OtpVerifyDto } from './dto/otp-verify.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../common/interfaces/current-user.interface.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('request-otp')
  @HttpCode(HttpStatus.OK)
  async requestOtpDirect(@Body() dto: OtpRequestDto) {
    return this.authService.requestOtp(dto);
  }

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  async requestOtp(@Body() dto: OtpRequestDto) {
    return this.authService.requestOtp(dto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtpDirect(@Body() dto: OtpVerifyDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: OtpVerifyDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('signup')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async signup(@CurrentUser() user: CurrentUserPayload, @Body() dto: SignupDto) {
    return this.authService.completeProfile(user.userId, dto);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(@CurrentUser() user: CurrentUserPayload, @Body() dto: SignupDto) {
    return this.authService.completeProfile(user.userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getCurrentUser(user.userId);
  }
}
