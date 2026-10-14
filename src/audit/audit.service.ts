import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  log(actorId: string, action: string, entityType: string, entityId: string, metadata?: any) {
    return this.prisma.auditLog.create({
      data: { actorId, action, entityType, entityId, metadata },
    });
  }

  list() {
    return this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }
}