import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateStatusDto {
  @IsNotEmpty()
  @IsString()
  status!: string;
}

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  code!: string;
}
