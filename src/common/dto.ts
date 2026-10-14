import {
  IsArray, IsDateString, IsIn, IsInt, IsNumber, IsOptional, IsString,
  IsUUID, Length, Matches, Max, MaxLength, Min, ValidateIf,
} from 'class-validator';

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

  // startAt is compulsory only for SCHEDULED bookings
  @ValidateIf((o) => o.bookingMode === 'SCHEDULED')
  @IsDateString()
  startAt?: string;

  @IsOptional() @IsInt() @Min(1) @Max(168)
  durationHours?: number;

  @IsNumber() @Min(-90) @Max(90)
  latitude: number;

  @IsNumber() @Min(-180) @Max(180)
  longitude: number;

  @IsOptional() @IsString() @MaxLength(300)
  address?: string;

  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;

  @IsOptional() @IsArray() @IsInt({ each: true }) @Min(1, { each: true })
  skillIds?: number[];
}

export class CreateOfferDto {
  @IsUUID()
  serviceRequestId: string;

  @IsUUID()
  workerId: string;
}