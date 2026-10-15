import {
  ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsNotEmpty, IsNumber,
  IsOptional, IsString, IsUUID, Length, Matches, Max, MaxLength, Min, ValidateIf, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

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
export class SetVerificationDto {
  @IsIn(['VERIFIED', 'REJECTED'])
  status: 'VERIFIED' | 'REJECTED';
}

export class PayDto {
  @IsUUID()
  timesheetId: string;

  @IsOptional() @IsBoolean()
  simulateFail?: boolean;
}
// ---------- start / end job ----------
export class VerifyJobDto {
  @Matches(/^\d{6}$/, { message: 'otp must be 6 digits' })
  otp: string;

  @IsNumber() @Min(-90) @Max(90)
  latitude: number;

  @IsNumber() @Min(-180) @Max(180)
  longitude: number;
}

// ---------- ratings and complaints ----------
export class RateDto {
  @IsUUID()
  assignmentId: string;

  // the service accepts either "rating" or "score"
  @IsOptional() @IsInt() @Min(1) @Max(5)
  rating?: number;

  @IsOptional() @IsInt() @Min(1) @Max(5)
  score?: number;

  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsString() @MaxLength(500)
  comment?: string;
}

export class ComplaintDto {
  @IsUUID()
  assignmentId: string;

  @IsIn(['NO_SHOW', 'POOR_QUALITY', 'OVERCHARGING', 'UNPROFESSIONAL', 'DAMAGED_PROPERTY', 'OTHER'])
  category: string;

  @IsString() @IsNotEmpty() @MaxLength(1000)
  description: string;
}

export class ResolveComplaintDto {
  @IsIn(['RESOLVED', 'DISMISSED'])
  status: 'RESOLVED' | 'DISMISSED';

  @IsString() @IsNotEmpty() @MaxLength(1000)
  resolution: string;
}

// ---------- worker profile and availability ----------
export class UpsertWorkerDto {
  @IsOptional() @IsInt() @Min(0) @Max(60)
  experienceYears?: number;

  @IsOptional() @IsNumber() @Min(0)
  baseHourlyRate?: number;

  @IsOptional() @IsNumber() @Min(1) @Max(100)
  serviceRadiusKm?: number;

  @IsOptional() @IsNumber() @Min(-90) @Max(90)
  latitude?: number;

  @IsOptional() @IsNumber() @Min(-180) @Max(180)
  longitude?: number;

  @IsOptional() @IsString() @MaxLength(500)
  profileImageUrl?: string;

  @IsOptional() @IsArray() @IsInt({ each: true }) @Min(1, { each: true })
  categoryIds?: number[];

  @IsOptional() @IsArray() @IsInt({ each: true }) @Min(1, { each: true })
  skillIds?: number[];
}

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class AvailabilitySlotDto {
  @IsInt() @Min(0) @Max(6)
  dayOfWeek: number;

  @Matches(TIME, { message: 'startTime must look like 09:30' })
  startTime: string;

  @Matches(TIME, { message: 'endTime must look like 17:00' })
  endTime: string;
}

export class SetAvailabilityDto {
  @IsArray() @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots: AvailabilitySlotDto[];
}
export class RefundDto {
  // leave out to refund everything that is left
  @IsOptional() @IsInt() @Min(1)
  amount?: number;

  @IsString() @IsNotEmpty() @MaxLength(500)
  reason: string;
}