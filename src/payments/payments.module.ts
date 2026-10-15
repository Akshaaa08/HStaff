import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PayoutsSettlementService } from './payouts-settlement.service';
import { MockPaymentGateway, PaymentGateway } from './payment-gateway';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PayoutsSettlementService,
    // To go live: replace MockPaymentGateway with the real provider class.
    { provide: PaymentGateway, useClass: MockPaymentGateway },
  ],
})
export class PaymentsModule {}