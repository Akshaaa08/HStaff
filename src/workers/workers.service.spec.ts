import { PrismaService } from '../prisma.service';
import { WorkersService } from './workers.service';

describe('WorkersService bank info', () => {
  const previousEncryptionKey = process.env.BANK_INFO_ENCRYPTION_KEY;
  const prisma = {
    workerProfile: { findUnique: jest.fn() },
    workerBankInfo: { upsert: jest.fn() },
  };
  const service = new WorkersService(prisma as unknown as PrismaService);
  const bankInfo = {
    id: 'bank-info-1',
    accountHolderName: 'A Worker',
    bankName: 'Example Bank',
    accountNumberEncrypted: 'ciphertext',
    accountNumberLast4: '9012',
    ifscCode: 'ABCD0123456',
    updatedAt: new Date('2026-10-25T00:00:00.000Z'),
  };

  beforeEach(() => {
    process.env.BANK_INFO_ENCRYPTION_KEY = 'a'.repeat(64);
    jest.clearAllMocks();
  });

  afterAll(() => {
    if (previousEncryptionKey === undefined) delete process.env.BANK_INFO_ENCRYPTION_KEY;
    else process.env.BANK_INFO_ENCRYPTION_KEY = previousEncryptionKey;
  });

  it('returns a masked account number from the worker profile', async () => {
    prisma.workerProfile.findUnique.mockResolvedValue({
      id: 'worker-1',
      userId: 'user-1',
      bankInfo,
    });

    const result = await service.getMe('user-1');

    expect(result.bankInfo).toEqual({
      id: bankInfo.id,
      accountHolderName: bankInfo.accountHolderName,
      bankName: bankInfo.bankName,
      ifscCode: bankInfo.ifscCode,
      updatedAt: bankInfo.updatedAt,
      accountNumberMasked: '****9012',
    });
    expect(result.bankInfo).not.toHaveProperty('accountNumber');
  });

  it('upserts bank info for the worker and normalizes the IFSC code', async () => {
    prisma.workerProfile.findUnique.mockResolvedValue({ id: 'worker-1' });
    prisma.workerBankInfo.upsert.mockResolvedValue(bankInfo);

    const result = await service.updateBankInfo('user-1', {
      accountHolderName: 'A Worker',
      bankName: 'Example Bank',
      accountNumber: '123456789012',
      ifscCode: 'abcd0123456',
    });

    expect(prisma.workerBankInfo.upsert).toHaveBeenCalledWith({
      where: { workerId: 'worker-1' },
      update: expect.objectContaining({
        accountHolderName: 'A Worker',
        bankName: 'Example Bank',
        accountNumberEncrypted: expect.any(String),
        accountNumberLast4: '9012',
        ifscCode: 'ABCD0123456',
      }),
      create: expect.objectContaining({
        workerId: 'worker-1',
        accountHolderName: 'A Worker',
        bankName: 'Example Bank',
        accountNumberEncrypted: expect.any(String),
        accountNumberLast4: '9012',
        ifscCode: 'ABCD0123456',
      }),
    });
    const savedData = prisma.workerBankInfo.upsert.mock.calls[0][0].create;
    expect(savedData.accountNumberEncrypted).not.toContain('123456789012');
    expect(savedData.accountNumberEncrypted.split(':')).toHaveLength(3);
    expect(result.accountNumberMasked).toBe('****9012');
    expect(result).not.toHaveProperty('accountNumber');
  });
});