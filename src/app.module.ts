import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';
import { AuthModule } from './auth/auth.module';
import { WorkersModule } from './workers/workers.module';
import { AdminModule } from './admin/admin.module';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
import { OffersModule } from './offers/offers.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { validateEnv } from './config/env.validation';
import { PaymentsModule } from './payments/payments.module';
import { FeedbackModule } from './feedback/feedback.module';
import { AuditModule } from './audit/audit.module';
import { EventsModule } from './events/events.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // 100 requests per minute per client
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    // enables the @Cron jobs (offer expiry)
    ScheduleModule.forRoot(),
    AuthModule,
    WorkersModule,
    AdminModule,
    ServiceRequestsModule,
    OffersModule,
    AssignmentsModule,
    PaymentsModule,
    FeedbackModule,
    AuditModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [
    PrismaService,
    RedisService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [PrismaService, RedisService],
})
export class AppModule {}