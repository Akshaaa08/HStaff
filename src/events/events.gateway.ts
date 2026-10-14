import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(private jwt: JwtService, private prisma: PrismaService) {}

  // Each connected user joins a private room named after their user id.
  async handleConnection(client: Socket) {
    try {
      const token = (client.handshake.auth?.token as string) ?? '';
      const payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_SECRET });
      client.join('user:' + payload.sub);
    } catch {
      client.disconnect();
    }
  }

  // Save the notification, then push it live. Never breaks the main request.
  async notify(userId: string, type: string, title: string, body: string, data?: any) {
    try {
      const n = await this.prisma.notification.create({
        data: { userId, type, title, body, data },
      });
      this.server?.to('user:' + userId).emit(type, n);
    } catch (e) {
      console.error('notify failed', e);
    }
  }
}