import { IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Length, Matches, Max, Min } from 'class-validator';

export class RequestOtpDto {
  @Matches(/^\d{10}$/, { message: 'phone must be 10 digits' })
  phone: string;
}

export class VerifyOtpDto {
  @Matches(/^\d{10}$/, { message: 'phone must be 10 digits' })
  phone: string;

  @IsString()
  @Length(6, 6, { message: 'code must be 6 digits' })
  code: string;

  @IsOptional()
  @IsIn(['USER', 'WORKER'])
  role?: 'USER' | 'WORKER';
}

export class CreateServiceRequestDto {
  @IsInt() @Min(1)
  categoryId: number;

  @IsOptional() @IsIn(['INSTANT', 'SCHEDULED'])
  bookingMode?: 'INSTANT' | 'SCHEDULED';

  @IsOptional() @IsDateString()
  startAt?: string;

  @IsOptional() @IsInt() @Min(1) @Max(168)
  durationHours?: number;

  @IsNumber() @Min(-90) @Max(90)
  latitude: number;

  @IsNumber() @Min(-180) @Max(180)
  longitude: number;

  @IsOptional() @IsString()
  address?: string;

  @IsOptional() @IsString()
  notes?: string;

    @IsOptional() @IsInt({ each: true }) @Min(1, { each: true })
  skillIds?: number[];
}

export class CreateOfferDto {
  @IsUUID()
  serviceRequestId: string;

  @IsUUID()
  workerId: string;
}
