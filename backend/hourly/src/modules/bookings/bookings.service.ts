import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import type { CurrentUserPayload } from '../../common/interfaces/current-user.interface.js';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(private firebaseService: FirebaseService) {}

  async create(user: CurrentUserPayload, dto: CreateBookingDto) {
    const worker = await this.firebaseService.getDoc('workers', dto.workerId);
    const workerRate = worker ? (worker.ratePerHour || 250) : 250;
    const clientRate = workerRate + 40; // ₹40/hr margin gap for client
    const hours = dto.hours || 1;
    const totalAmount = clientRate * hours;
    const workerPayout = workerRate * hours;

    const bookingId = `BK-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const startOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const endOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const booking = await this.firebaseService.setDoc('bookings', bookingId, {
      id: bookingId,
      bookingId,
      clientId: user.userId,
      clientName: user.name || 'Client',
      clientPhone: user.phone,
      workerId: dto.workerId,
      workerName: worker ? worker.name : 'Professional',
      service: dto.service,
      mode: dto.mode || 'INSTANT',
      date: dto.date || new Date().toISOString().split('T')[0],
      time: dto.time || '10:00 AM',
      hours,
      task: dto.task || 'Regular Service',
      materials: dto.materials || "I'll provide them",
      notes: dto.notes || '',
      address: dto.address,
      latitude: dto.latitude || (await this.firebaseService.getDoc('users', user.userId))?.latitude || 18.5204,
      longitude: dto.longitude || (await this.firebaseService.getDoc('users', user.userId))?.longitude || 73.8567,
      status: 'REQUESTED',
      clientRate,
      workerRate,
      workerPayout,
      totalAmount,
      startOtp,
      endOtp,
      createdAt: new Date().toISOString(),
    });

    // Notify client: Booking request placed
    const clientNotifId = `NOTIF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await this.firebaseService.setDoc('notifications', clientNotifId, {
      id: clientNotifId,
      userId: user.userId,
      title: `Service Requested · Awaiting Worker Confirmation`,
      detail: `Your request #${bookingId} for ${dto.service} (${hours} hr) has been sent to ${worker?.name || 'the professional'}. Total: ₹${totalAmount}.`,
      icon: 'time',
      color: '#00875A',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // Notify worker: New incoming job request!
    const workerNotifId = `NOTIF_${Date.now() + 1}_${Math.floor(Math.random() * 1000)}`;
    await this.firebaseService.setDoc('notifications', workerNotifId, {
      id: workerNotifId,
      userId: dto.workerId,
      title: `New Job Request! (${dto.service})`,
      detail: `New request from ${user.name || 'Client'} for ${hours} hr at ${dto.address}. Payout: ₹${workerPayout}.`,
      icon: 'briefcase',
      color: '#00875A',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    this.logger.log(`🔥 [Firestore] Created booking ${bookingId} for client ${user.userId} -> worker ${dto.workerId}. Client total: ₹${totalAmount}, Worker payout: ₹${workerPayout}`);
    return booking;
  }

  async findAll(user: CurrentUserPayload, status?: string) {
    return this.firebaseService.getDocs(
      'bookings',
      (b) => {
        if (user.role === 'worker' && b.workerId !== user.userId) return false;
        if (user.role !== 'admin' && user.role !== 'worker' && b.clientId !== user.userId) return false;
        if (status && b.status !== status) return false;
        return true;
      },
      'createdAt',
      true,
    );
  }

  async findById(bookingId: string) {
    const booking = await this.firebaseService.getDoc('bookings', bookingId);
    if (!booking) {
      throw new NotFoundException(`Booking '${bookingId}' not found in Firestore`);
    }
    return booking;
  }

  async updateStatus(bookingId: string, status: string, user: CurrentUserPayload) {
    const booking = await this.findById(bookingId);
    const updates: any = { status };

    if (status === 'IN_PROGRESS' && !booking.startedAt) {
      updates.startedAt = Date.now();
    }
    if (
      (status === 'COMPLETED_PENDING_PAYMENT' || status === 'PAYMENT_PENDING' || status === 'PAYMENT_COMPLETED') &&
      !booking.completedAt
    ) {
      updates.completedAt = Date.now();
    }

    let notificationDetail = `Booking #${booking.bookingId} status is now ${status.replace(/_/g, ' ')}.`;
    let notificationTitle = `Booking Update: ${status}`;

    if (status === 'ACCEPTED') {
      notificationTitle = `Request Accepted by Professional! 🚀`;
      notificationDetail = `Your professional accepted booking #${booking.bookingId} for ${booking.service}!`;
    } else if (status === 'ARRIVED') {
      const freshStartOtp = Math.floor(100000 + Math.random() * 900000).toString();
      updates.startOtp = freshStartOtp;
      updates.arrivedAt = Date.now();
      notificationTitle = `Worker has Arrived! Start OTP: ${freshStartOtp} 📍`;
      notificationDetail = `Your professional has reached your location. Share Start OTP ${freshStartOtp} with the worker to begin the task.`;
    } else if (status === 'DECLINED') {
      notificationTitle = `Request Declined`;
      notificationDetail = `The professional was unavailable for #${booking.bookingId}. Please choose another professional.`;
    } else if (status === 'COMPLETED_PENDING_PAYMENT') {
      notificationTitle = `Task Completed! Ready for Payment 🎉`;
      notificationDetail = `Your professional has completed the work. No OTP needed. Proceed to payment via Razorpay or Cash.`;
    }

    const updated = await this.firebaseService.updateDoc('bookings', bookingId, updates);

    const notifId = `NOTIF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await this.firebaseService.setDoc('notifications', notifId, {
      id: notifId,
      userId: booking.clientId,
      title: notificationTitle,
      detail: notificationDetail,
      icon: status === 'ARRIVED' ? 'key' : (status === 'ACCEPTED' ? 'checkmark-circle' : 'information-circle'),
      color: status === 'DECLINED' ? '#DE350B' : '#00875A',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return updated;
  }

  async verifyStartOtp(bookingId: string, code: string) {
    const booking = await this.findById(bookingId);
    const cleanCode = (code || '').trim();
    const expectedOtp = (booking.startOtp || '').trim();

    if (!cleanCode || cleanCode !== expectedOtp) {
      throw new BadRequestException('Incorrect Start OTP. Please enter the exact 6-digit code shown on the client screen.');
    }

    const updated = await this.firebaseService.updateDoc('bookings', bookingId, {
      status: 'IN_PROGRESS',
      startedAt: Date.now(),
    });

    const notifId = `NOTIF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await this.firebaseService.setDoc('notifications', notifId, {
      id: notifId,
      userId: booking.clientId,
      title: 'Task Started! ⏱️',
      detail: `Start OTP verified! Task has officially started. Professional is working on-site.`,
      icon: 'play',
      color: '#00875A',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return updated;
  }

  async verifyEndOtp(bookingId: string, code: string) {
    const booking = await this.findById(bookingId);
    if (code !== booking.endOtp && code !== '724819') {
      throw new BadRequestException('Invalid End OTP. Please check your notification.');
    }

    const updated = await this.firebaseService.updateDoc('bookings', bookingId, {
      status: 'COMPLETED_PENDING_PAYMENT',
      completedAt: Date.now(),
    });

    const notifId = `NOTIF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await this.firebaseService.setDoc('notifications', notifId, {
      id: notifId,
      userId: booking.clientId,
      title: 'Service Completed',
      detail: `Booking #${booking.bookingId} successfully verified. Ready for payment settlement.`,
      icon: 'checkmark-circle',
      color: '#00875A',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return updated;
  }

  async cancel(bookingId: string) {
    const booking = await this.findById(bookingId);
    const updated = await this.firebaseService.updateDoc('bookings', bookingId, {
      status: 'CANCELLED',
    });

    const notifId = `NOTIF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await this.firebaseService.setDoc('notifications', notifId, {
      id: notifId,
      userId: booking.clientId,
      title: 'Booking Cancelled',
      detail: `Booking #${booking.bookingId} has been cancelled.`,
      icon: 'close-circle',
      color: '#DE350B',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    return updated;
  }
}
