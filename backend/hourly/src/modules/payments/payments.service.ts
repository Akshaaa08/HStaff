import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service.js';
import { ProcessPaymentDto } from './dto/process-payment.dto.js';
import type { CurrentUserPayload } from '../../common/interfaces/current-user.interface.js';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private firebaseService: FirebaseService) {}

  async processPayment(user: CurrentUserPayload, dto: ProcessPaymentDto) {
    const booking = await this.firebaseService.getDoc('bookings', dto.bookingId);
    if (!booking) {
      throw new NotFoundException(`Booking '${dto.bookingId}' not found in Firestore`);
    }

    const isCash = dto.method === 'CASH' || dto.method.toLowerCase().includes('cash');
    const paymentId = dto.razorpayPaymentId || `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const gatewayReference = isCash ? `CASH_DELIVERY_${Date.now()}` : (dto.razorpayPaymentId || `RAZORPAY_${Date.now()}`);
    const methodDisplay = isCash ? 'Cash on Task Completion' : (dto.method.includes('Razorpay') ? dto.method : `Razorpay (${dto.method})`);

    const payment = await this.firebaseService.setDoc('payments', paymentId, {
      id: paymentId,
      bookingId: booking.bookingId || booking.id,
      amount: dto.amount,
      method: methodDisplay,
      isCash,
      status: 'SUCCEEDED',
      gateway: isCash ? 'CASH' : 'RAZORPAY',
      gatewayReference,
      razorpayPaymentId: dto.razorpayPaymentId || null,
      razorpayOrderId: dto.razorpayOrderId || null,
      createdAt: new Date().toISOString(),
    });

    const updatedBooking = await this.firebaseService.updateDoc('bookings', dto.bookingId, {
      status: 'PAYMENT_COMPLETED',
      paymentMethod: methodDisplay,
      razorpayPaymentId: dto.razorpayPaymentId || null,
      paidAt: new Date().toISOString(),
    });

    // Notify client
    const notifId = `NOTIF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await this.firebaseService.setDoc('notifications', notifId, {
      id: notifId,
      userId: user.userId,
      title: isCash ? 'Cash Payment Recorded 💵' : 'Razorpay Payment Successful 🔒',
      detail: `Paid ₹${dto.amount} via ${methodDisplay} for booking #${booking.bookingId || booking.id}.`,
      icon: isCash ? 'cash' : 'checkmark-circle',
      color: '#00875A',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // Notify worker
    const workerTarget = booking.workerId || booking.professionalId;
    if (workerTarget) {
      const workerNotifId = `NOTIF_${Date.now()}_${Math.floor(Math.random() * 1000) + 1}`;
      await this.firebaseService.setDoc('notifications', workerNotifId, {
        id: workerNotifId,
        userId: workerTarget,
        title: isCash ? 'Cash Received from Client 💵' : 'Payment Received via Razorpay 💰',
        detail: `Client paid ₹${dto.amount} (${methodDisplay}) for booking #${booking.bookingId || booking.id}. Job complete!`,
        icon: 'cash-outline',
        color: '#00875A',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      // Increment worker's completed jobs count in workers collection
      try {
        const workerDoc = await this.firebaseService.getDoc('workers', workerTarget);
        if (workerDoc) {
          await this.firebaseService.updateDoc('workers', workerTarget, {
            jobs: (workerDoc.jobs || 0) + 1,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        this.logger.warn(`Could not increment worker jobs count: ${err.message}`);
      }
    }

    this.logger.log(`🔥 [Firestore] Payment confirmed (${methodDisplay}) for booking ${booking.bookingId || booking.id}: ₹${dto.amount}`);

    return {
      success: true,
      payment,
      booking: updatedBooking,
    };
  }

  async getPaymentForBooking(bookingId: string) {
    const list = await this.firebaseService.getDocs('payments', (p) => p.bookingId === bookingId);
    return list[0] || null;
  }
}
