import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { CurrentUserPayload } from '../../common/interfaces/current-user.interface.js';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.create(user, dto);
  }

  @Get('worker/:workerId')
  async findByWorker(@Param('workerId') workerId: string) {
    return this.reviewsService.findByWorker(workerId);
  }
}
