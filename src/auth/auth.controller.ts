import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RequestOtpDto, VerifyOtpDto } from '../common/dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // max 5 OTP requests per minute per client
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('request-otp')
  requestOtp(@Body() body: RequestOtpDto) {
    return this.auth.requestOtp(body.phone);
  }

  // max 10 verify attempts per minute per client
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify-otp')
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.auth.verifyOtp(body.phone, body.code, body.role);
  }
}