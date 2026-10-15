import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service.js';
import type { CurrentUserPayload } from '../../common/interfaces/current-user.interface.js';

@Injectable()
export class NotificationsService {
  constructor(private firebaseService: FirebaseService) {}

  async findAllForUser(user: CurrentUserPayload) {
    return this.firebaseService.getDocs(
      'notifications',
      (n) => n.userId === user.userId || n.userId === user.phone,
      'createdAt',
      true,
    );
  }

  async markAsRead(notificationId: string, user: CurrentUserPayload) {
    const notification = await this.firebaseService.getDoc('notifications', notificationId);
    if (!notification) {
      throw new NotFoundException('Notification not found in Firestore');
    }

    return this.firebaseService.updateDoc('notifications', notificationId, {
      isRead: true,
    });
  }

  async markAllAsRead(user: CurrentUserPayload) {
    const list = await this.findAllForUser(user);
    for (const item of list) {
      await this.firebaseService.updateDoc('notifications', item.id, { isRead: true });
    }
    return { success: true, message: 'All notifications marked as read in Firestore' };
  }
}
