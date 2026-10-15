import { IsNotEmpty, IsString, IsNumber, Min, IsOptional } from 'class-validator';

export class ProcessPaymentDto {
  @IsNotEmpty()
  @IsString()
  bookingId!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount!: number;

  @IsNotEmpty()
  @IsString()
  method!: string;

  @IsOptional()
  @IsString()
  razorpayPaymentId?: string;

  @IsOptional()
  @IsString()
  razorpayOrderId?: string;
}

