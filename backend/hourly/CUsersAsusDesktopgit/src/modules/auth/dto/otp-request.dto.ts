import { IsNotEmpty, IsString, Matches, IsOptional, IsIn } from 'class-validator';

export class OtpRequestDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @Matches(/^[6-9]\d{9}$/, { message: 'Phone must be a valid 10-digit Indian mobile number' })
  phone!: string;

  @IsOptional()
  @IsIn(['client', 'worker', 'admin'], { message: 'Role must be client, worker, or admin' })
  role?: 'client' | 'worker' | 'admin' = 'client';
}
