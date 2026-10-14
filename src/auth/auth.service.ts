import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 300;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private redis: RedisService,
  ) {}

  async requestOtp(phone: string) {
    // Rate limit: max 1 code per 30 seconds per phone
    const recent = await this.prisma.otpCode.findFirst({
      where: { phone, createdAt: { gt: new Date(Date.now() - 30_000) } },
    });
    if (recent) throw new BadRequestException('Wait 30 seconds before requesting another code');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash: await bcrypt.hash(code, 10),
        expiresAt: new Date(Date.now() + 5 * 60_000),
      },
    });

    console.log(`\n=== MOCK SMS === OTP for ${phone}: ${code}\n`);
    return { message: 'OTP sent (check server console in dev mode)' };
  }

  async verifyOtp(phone: string, code: string, role?: 'USER' | 'WORKER') {
    // Brute-force protection: too many wrong codes locks this phone for a while.
    const key = `otp-attempts:${phone}`;
    const attempts = Number((await this.redis.client.get(key)) ?? 0);
    if (attempts >= MAX_ATTEMPTS) {
      throw new HttpException('Too many wrong codes. Try again in 5 minutes.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const record = await this.prisma.otpCode.findFirst({
      where: { phone, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!record || !(await bcrypt.compare(code, record.codeHash))) {
      await this.redis.client.multi().incr(key).expire(key, LOCK_SECONDS).exec();
      throw new BadRequestException('Invalid or expired code');
    }
    await this.redis.client.del(key);
    await this.prisma.otpCode.deleteMany({ where: { phone } });

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { phone, role: role ?? 'USER', phoneVerifiedAt: new Date() },
      });
    } else if (!user.phoneVerifiedAt) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerifiedAt: new Date() },
      });
    }

    const token = await this.jwt.signAsync({ sub: user.id, role: user.role });
    return { token, user: { id: user.id, phone: user.phone, role: user.role } };
  }
}