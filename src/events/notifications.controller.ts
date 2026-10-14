import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma.service';
import { EventsGateway } from '../events/events.gateway';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  list(@Req() req: any) {
    return this.prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  @Post(':id/read')
  read(@Req() req: any, @Param('id') id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId: req.user.userId },
      data: { readAt: new Date() },
    });
  }
}