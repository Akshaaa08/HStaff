import { IsNotEmpty, IsString, IsNumber, IsOptional, IsIn, Min, Max } from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsString()
  service!: string;

  @IsNotEmpty()
  @IsString()
  workerId!: string;

  @IsOptional()
  @IsIn(['INSTANT', 'SCHEDULED'])
  mode?: 'INSTANT' | 'SCHEDULED' = 'INSTANT';

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  time?: string;

  @IsNumber()
  @Min(1)
  @Max(8)
  hours: number = 1;

  @IsOptional()
  @IsString()
  task?: string;

  @IsOptional()
  @IsString()
  materials?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNotEmpty()
  @IsString()
  address!: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
