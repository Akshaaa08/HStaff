import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { RedisService } from '../redis.service';
import { SmsService } from '../sms/sms.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({ hash: jest.fn().mockResolvedValue('hashed-code') }));

describe('AuthService OTP delivery', () => {
  const prisma = {
    otpCode: { findFirst: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
  };
  const sms = { send: jest.fn() };
  const service = new AuthService(
    prisma as unknown as PrismaService,
    {} as JwtService,
    {} as RedisService,
    sms as unknown as SmsService,
  );
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.otpCode.findFirst.mockResolvedValue(null);
    prisma.otpCode.create.mockResolvedValue({ id: 'otp-record-1' });
    prisma.otpCode.deleteMany.mockResolvedValue({ count: 1 });
    sms.send.mockResolvedValue(undefined);
  });

  it('sends the generated login code and never returns it in the API result', async () => {
    const result = await service.requestOtp('9876543210');

    expect(sms.send).toHaveBeenCalledWith(
      '9876543210',
      expect.stringMatching(/^Your H-Staff sign-in code is \d{6}\./),
    );
    expect(result).toEqual({ message: 'OTP sent by SMS' });
    expect(result).not.toHaveProperty('otp');
  });

  it('removes the OTP record if SMS delivery fails', async () => {
    sms.send.mockRejectedValue(new Error('delivery failed'));

    await expect(service.requestOtp('9876543210')).rejects.toThrow('delivery failed');

    expect(prisma.otpCode.deleteMany).toHaveBeenCalledWith({ where: { id: 'otp-record-1' } });
  });
});