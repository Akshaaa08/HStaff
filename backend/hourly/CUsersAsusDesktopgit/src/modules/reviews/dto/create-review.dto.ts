import { IsNotEmpty, IsString, IsNumber, Min, Max, IsArray, IsOptional } from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty()
  @IsString()
  bookingId!: string;

  @IsNotEmpty()
  @IsString()
  workerId!: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] = [];

  @IsOptional()
  @IsString()
  comment?: string;
}
