import { IsNotEmpty, IsString, Length, Matches, IsOptional, IsIn } from 'class-validator';

export class OtpVerifyDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Phone must be a valid 10-digit Indian mobile number' })
  phone!: string;

  @IsNotEmpty({ message: 'OTP is required' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;

  @IsOptional()
  @IsIn(['client', 'worker', 'admin'])
  role?: 'client' | 'worker' | 'admin' = 'client';
}
