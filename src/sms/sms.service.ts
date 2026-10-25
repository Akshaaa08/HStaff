import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class SmsService {
  async send(phone: string, message: string): Promise<void> {
    if (!/^\d{10}$/.test(phone)) throw new BadRequestException('SMS recipient must be a 10-digit Indian mobile number');

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;
    if (!accountSid || !authToken || !fromNumber) {
      throw new ServiceUnavailableException('SMS delivery is not configured');
    }

    const body = new URLSearchParams({ To: `+91${phone}`, From: fromNumber, Body: message });
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );
    if (!response.ok) throw new ServiceUnavailableException('SMS delivery failed');
  }
}