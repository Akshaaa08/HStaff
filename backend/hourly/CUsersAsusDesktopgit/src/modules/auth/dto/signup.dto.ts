import { IsNotEmpty, IsString, IsOptional, IsIn, IsNumber } from 'class-validator';

export class SignupDto {
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsIn(['client', 'worker'], { message: 'Role must be client or worker' })
  role?: 'client' | 'worker' = 'client';

  // Address fields with map geocoding
  @IsNotEmpty({ message: 'Address is required' })
  @IsString()
  address!: string;

  @IsOptional()
  @IsString()
  houseFlat?: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  // Worker specific fields
  @IsOptional()
  @IsString()
  serviceCategory?: string;

  @IsOptional()
  @IsNumber()
  years?: number;

  @IsOptional()
  @IsString()
  experienceDetails?: string;

  @IsOptional()
  skills?: string[];

  @IsOptional()
  @IsNumber()
  ratePerHour?: number;

  @IsOptional()
  @IsString()
  equipment?: string;

  @IsOptional()
  @IsString()
  languages?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
