import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FirebaseService } from '../../firebase/firebase.service.js';
import { OtpRequestDto } from './dto/otp-request.dto.js';
import { OtpVerifyDto } from './dto/otp-verify.dto.js';
import { SignupDto } from './dto/signup.dto.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private firebaseService: FirebaseService,
    private jwtService: JwtService,
  ) {}

  async requestOtp(dto: OtpRequestDto) {
    this.logger.log(`Generating OTP for phone: ${dto.phone} (${dto.role || 'client'})`);

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    let user = await this.firebaseService.getDoc('users', dto.phone);
    if (!user) {
      user = await this.firebaseService.setDoc('users', dto.phone, {
        id: dto.phone,
        phone: dto.phone,
        role: dto.role || 'client',
        name: '',
        currentOtp: generatedOtp,
        otpExpiresAt: expiresAt,
        city: 'Pune',
        isProfileComplete: false,
      });
    } else {
      user = await this.firebaseService.updateDoc('users', dto.phone, {
        currentOtp: generatedOtp,
        otpExpiresAt: expiresAt,
        ...(dto.role ? { role: dto.role } : {}),
      });
    }

    // Save in-app OTP notification into Firestore
    const notificationId = `NOTIF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const notification = await this.firebaseService.setDoc('notifications', notificationId, {
      id: notificationId,
      userId: dto.phone,
      title: 'Verification Code',
      detail: `Your Hourly OTP code is ${generatedOtp}. Valid for 10 minutes. Do not share it with anyone.`,
      icon: 'key',
      color: '#FF9C7A',
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    this.logger.log(`🔥 [Firebase] OTP delivered via notification for ${dto.phone}: ${generatedOtp}`);

    return {
      success: true,
      message: 'Verification code sent via in-app notification.',
      phone: dto.phone,
      notification: {
        id: notification.id,
        title: notification.title,
        detail: notification.detail,
        otp: generatedOtp,
      },
    };
  }

  async verifyOtp(dto: OtpVerifyDto) {
    const user = await this.firebaseService.getDoc('users', dto.phone);
    if (!user) {
      throw new BadRequestException('User not found. Please request an OTP first.');
    }

    // Authentic OTP verification
    const isValidOtp = user.currentOtp && user.currentOtp === dto.otp;

    if (!isValidOtp) {
      throw new BadRequestException('Invalid verification code. Please enter the OTP sent to your notifications.');
    }

    if (user.otpExpiresAt && new Date().toISOString() > user.otpExpiresAt) {
      throw new BadRequestException('Verification code has expired. Please request a new code.');
    }

    // Clear OTP after successful verification
    await this.firebaseService.updateDoc('users', dto.phone, {
      phoneVerifiedAt: new Date().toISOString(),
      currentOtp: null,
      otpExpiresAt: null,
    });

    const isProfileComplete = Boolean(
      user.name && user.name.trim().length > 0 && user.address && user.address.trim().length > 0,
    );

    const payload = {
      sub: user.id || user.phone,
      phone: user.phone,
      role: user.role || 'client',
      name: user.name || '',
    };

    const accessToken = this.jwtService.sign(payload);

    // If Firebase Auth is connected, create a Firebase Auth custom token
    let firebaseCustomToken: string | undefined;
    const auth = this.firebaseService.getAuth();
    if (auth) {
      try {
        firebaseCustomToken = await auth.createCustomToken(user.phone);
      } catch {
        // Fallback
      }
    }

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 604800,
      firebase_token: firebaseCustomToken,
      isProfileComplete,
      user: {
        ...user,
        id: user.id || user.phone,
        phone: user.phone,
        name: user.name || '',
        role: user.role || 'client',
        city: user.city || 'Pune',
        address: user.address || '',
        imageUrl: user.imageUrl || '',
        isProfileComplete,
      },
    };
  }

  async completeProfile(userId: string, dto: SignupDto) {
    this.logger.log(`Completing profile for user: ${userId} (${dto.role || 'client'})`);

    const userUpdates: any = {
      name: dto.name,
      email: dto.email || '',
      role: dto.role || 'client',
      address: dto.address,
      houseFlat: dto.houseFlat || '',
      landmark: dto.landmark || '',
      city: dto.city || 'Pune',
      state: dto.state || 'Maharashtra',
      postalCode: dto.postalCode || '',
      latitude: dto.latitude || null,
      longitude: dto.longitude || null,
      isProfileComplete: true,
      updatedAt: new Date().toISOString(),
    };

    if (dto.role === 'worker') {
      userUpdates.serviceCategory = dto.serviceCategory || 'General Help';
      userUpdates.years = dto.years || 1;
      userUpdates.experienceDetails = dto.experienceDetails || '';
      userUpdates.skills = dto.skills || [dto.serviceCategory || 'General Help'];
      userUpdates.ratePerHour = dto.ratePerHour || 250;
      userUpdates.equipment = dto.equipment || '';
      userUpdates.languages = dto.languages || 'Marathi, Hindi, English';
      userUpdates.bio = dto.bio || dto.experienceDetails || '';
      if (dto.imageUrl) userUpdates.imageUrl = dto.imageUrl;

      // Save / Update in Firestore workers collection so they are discoverable
      const workerPayload = {
        id: userId,
        workerId: userId,
        name: dto.name,
        phone: userId,
        serviceCategory: dto.serviceCategory || 'General Help',
        years: dto.years || 1,
        experienceDetails: dto.experienceDetails || '',
        skills: dto.skills || [dto.serviceCategory || 'General Help'],
        ratePerHour: dto.ratePerHour || 250,
        equipment: dto.equipment || '',
        languages: dto.languages || 'Marathi, Hindi, English',
        bio: dto.bio || dto.experienceDetails || 'Experienced professional domestic staff.',
        city: dto.city || 'Pune',
        address: dto.address,
        latitude: dto.latitude || 18.5204,
        longitude: dto.longitude || 73.8567,
        rating: 5.0,
        jobs: 0,
        distanceKm: 1.5,
        onTimePercent: '100%',
        isVerified: true,
        imageUrl:
          dto.imageUrl ||
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
      };
      await this.firebaseService.setDoc('workers', userId, workerPayload);
      this.logger.log(`✅ Saved authentic worker profile to Firestore: ${dto.name} (${userId})`);
    }

    const updatedUser = await this.firebaseService.updateDoc('users', userId, userUpdates);

    // Re-issue JWT with real name and role
    const payload = {
      sub: userId,
      phone: updatedUser.phone,
      role: updatedUser.role,
      name: updatedUser.name,
    };
    const accessToken = this.jwtService.sign(payload);

    return {
      success: true,
      access_token: accessToken,
      user: {
        id: updatedUser.id || updatedUser.phone,
        phone: updatedUser.phone,
        name: updatedUser.name,
        role: updatedUser.role,
        city: updatedUser.city,
        address: updatedUser.address,
        isProfileComplete: true,
        serviceCategory: updatedUser.serviceCategory,
        years: updatedUser.years,
        ratePerHour: updatedUser.ratePerHour,
      },
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.firebaseService.getDoc('users', userId);
    if (!user) {
      throw new UnauthorizedException('User not found in Firestore');
    }
    const { currentOtp, otpExpiresAt, ...safeUser } = user;
    return safeUser;
  }
}
