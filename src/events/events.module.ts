import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventsGateway } from './events.gateway';
import { NotificationsController } from './notifications.controller';

@Global()
@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [NotificationsController],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}