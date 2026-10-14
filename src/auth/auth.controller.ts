import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto, VerifyOtpDto } from '../common/dto';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('request-otp')
  requestOtp(@Body() body: RequestOtpDto) {
    return this.auth.requestOtp(body.phone);
  }

  @Post('verify-otp')
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.auth.verifyOtp(body.phone, body.code, body.role);
  }
}