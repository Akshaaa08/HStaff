import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import type { CurrentUserPayload } from '../../common/interfaces/current-user.interface.js';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private firebaseService: FirebaseService) {}

  async create(user: CurrentUserPayload, dto: CreateReviewDto) {
    const reviewId = `REV_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const review = await this.firebaseService.setDoc('reviews', reviewId, {
      id: reviewId,
      bookingId: dto.bookingId,
      workerId: dto.workerId,
      clientId: user.userId,
      rating: dto.rating,
      tags: dto.tags || [],
      comment: dto.comment || '',
      createdAt: new Date().toISOString(),
    });

    await this.firebaseService.updateDoc('bookings', dto.bookingId, {
      rating: dto.rating,
      review: dto.comment || '',
      status: 'CLOSED',
    });

    // Update worker stats in Firestore
    const worker = await this.firebaseService.getDoc('workers', dto.workerId);
    if (worker) {
      const allReviews = await this.firebaseService.getDocs('reviews', (r) => r.workerId === dto.workerId);
      const avg = allReviews.reduce((sum, r) => sum + (r.rating || 5), 0) / (allReviews.length || 1);
      await this.firebaseService.updateDoc('workers', dto.workerId, {
        rating: Math.round(avg * 10) / 10,
        jobs: (worker.jobs || 0) + 1,
      });
    }

    const notifId = `NOTIF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await this.firebaseService.setDoc('notifications', notifId, {
      id: notifId,
      userId: user.userId,
      title: 'Review Submitted',
      detail: `Thank you for rating your service experience (${dto.rating}/5 stars).`,
      icon: 'star',
      color: '#FFAB00',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    this.logger.log(`🔥 [Firestore] Review recorded for booking ${dto.bookingId} by user ${user.userId}`);
    return review;
  }

  async findByWorker(workerId: string) {
    return this.firebaseService.getDocs('reviews', (r) => r.workerId === workerId, 'createdAt', true);
  }
}
