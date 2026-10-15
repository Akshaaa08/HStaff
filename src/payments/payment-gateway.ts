import { Injectable } from '@nestjs/common';

// The contract every payment provider must follow.
// Later, Ram writes a real class (Razorpay, Cashfree...) and swaps it in payments.module.ts.
export abstract class PaymentGateway {
  abstract refund(paymentRef: string | null, amount: number): Promise<{ ref: string }>;
  abstract payout(workerId: string, amount: number): Promise<{ ref: string }>;
}

@Injectable()
export class MockPaymentGateway extends PaymentGateway {
  async refund(paymentRef: string | null, amount: number) {
    return { ref: `MOCK-REFUND-${Date.now()}` };
  }

  async payout(workerId: string, amount: number) {
    return { ref: `MOCK-PAYOUT-${Date.now()}` };
  }
}