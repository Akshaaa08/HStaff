import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

// The contract every payment provider must follow.
// The idempotencyKey lets a real gateway refuse to do the same operation twice.
export abstract class PaymentGateway {
  abstract refund(paymentRef: string | null, amount: number, idempotencyKey: string): Promise<{ ref: string }>;
  abstract payout(workerId: string, amount: number, idempotencyKey: string): Promise<{ ref: string }>;
}

@Injectable()
export class MockPaymentGateway extends PaymentGateway {
  async refund(paymentRef: string | null, amount: number, idempotencyKey: string) {
    return { ref: `MOCK-REFUND-${randomUUID()}` };
  }

  async payout(workerId: string, amount: number, idempotencyKey: string) {
    return { ref: `MOCK-PAYOUT-${randomUUID()}` };
  }
}