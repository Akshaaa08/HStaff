import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { SmsService } from './sms.service';

describe('SmsService', () => {
  const service = new SmsService();
  const previousEnv = {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
  };
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.TWILIO_ACCOUNT_SID = 'AC123';
    process.env.TWILIO_AUTH_TOKEN = 'token';
    process.env.TWILIO_FROM_NUMBER = '+15005550006';
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: true }) as unknown as typeof fetch;
  });

  afterAll(() => {
    if (previousEnv.accountSid === undefined) delete process.env.TWILIO_ACCOUNT_SID;
    else process.env.TWILIO_ACCOUNT_SID = previousEnv.accountSid;
    if (previousEnv.authToken === undefined) delete process.env.TWILIO_AUTH_TOKEN;
    else process.env.TWILIO_AUTH_TOKEN = previousEnv.authToken;
    if (previousEnv.fromNumber === undefined) delete process.env.TWILIO_FROM_NUMBER;
    else process.env.TWILIO_FROM_NUMBER = previousEnv.fromNumber;
    globalThis.fetch = originalFetch;
  });

  it('sends SMS to the Indian E.164 recipient through Twilio', async () => {
    await service.send('9876543210', 'Your code is 123456');

    const [url, options] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.twilio.com/2010-04-01/Accounts/AC123/Messages.json');
    expect(options.headers.Authorization).toBe(`Basic ${Buffer.from('AC123:token').toString('base64')}`);
    expect(String(options.body)).toContain('To=%2B919876543210');
    expect(String(options.body)).toContain('Your+code+is+123456');
  });

  it('does not call Twilio for an invalid recipient', async () => {
    await expect(service.send('123', 'message')).rejects.toBeInstanceOf(BadRequestException);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('fails clearly when Twilio credentials are missing', async () => {
    delete process.env.TWILIO_AUTH_TOKEN;

    await expect(service.send('9876543210', 'message')).rejects
      .toBeInstanceOf(ServiceUnavailableException);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });
});