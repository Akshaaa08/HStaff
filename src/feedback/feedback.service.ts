import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

const CATEGORIES = ['NO_SHOW', 'POOR_QUALITY', 'OVERCHARGING', 'UNPROFESSIONAL', 'DAMAGED_PROPERTY', 'OTHER'];

@Injectable()
export class FeedbackService {
  constructor(private prisma: PrismaService) {}

  // Finds who the caller is in this assignment and who the other person is.
  private async parties(userId: string, assignmentId: string) {
    const a = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { serviceRequest: true, worker: true },
    });
    if (!a) throw new NotFoundException('Assignment not found');
    const hirerId = a.serviceRequest.userId;
    const workerUserId = a.worker.userId;
    if (userId !== hirerId && userId !== workerUserId) throw new ForbiddenException('Not your assignment');
    return { a, otherId: userId === hirerId ? workerUserId : hirerId };
  }

  async rate(userId: string, body: any) {
    const { a, otherId } = await this.parties(userId, body.assignmentId);
    if (a.status !== 'COMPLETED') throw new BadRequestException('Service is not completed yet');
    const score = Number(body.rating ?? body.score);
    if (!Number.isInteger(score) || score < 1 || score > 5) throw new BadRequestException('rating must be 1 to 5');
    const dup = await this.prisma.rating.findUnique({
      where: { assignmentId_raterId: { assignmentId: a.id, raterId: userId } },
    });
    if (dup) throw new BadRequestException('You already rated this assignment');
    return this.prisma.rating.create({
      data: {
        assignmentId: a.id,
        raterId: userId,
        rateeId: otherId,
        score,
        tags: Array.isArray(body.tags) ? body.tags : [],
        comment: body.comment,
      },
    });
  }

  async complain(userId: string, body: any) {
    const { a, otherId } = await this.parties(userId, body.assignmentId);
    if (!CATEGORIES.includes(body.category)) {
      throw new BadRequestException(`category must be one of: ${CATEGORIES.join(', ')}`);
    }
    if (!body.description) throw new BadRequestException('description is required');
    return this.prisma.complaint.create({
      data: {
        assignmentId: a.id,
        complainantId: userId,
        respondentId: otherId,
        category: body.category,
        description: body.description,
      },
    });
  }

  listComplaints() {
    return this.prisma.complaint.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        complainant: { select: { phone: true, role: true } },
        respondent: { select: { phone: true, role: true } },
      },
    });
  }

  async resolve(id: string, body: { status: 'RESOLVED' | 'DISMISSED'; resolution: string }) {
    const c = await this.prisma.complaint.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Complaint not found');
    if (c.status === 'RESOLVED' || c.status === 'DISMISSED') throw new BadRequestException(`Already ${c.status}`);
    if (body.status !== 'RESOLVED' && body.status !== 'DISMISSED') {
      throw new BadRequestException('status must be RESOLVED or DISMISSED');
    }
    return this.prisma.complaint.update({
      where: { id },
      data: { status: body.status, resolution: body.resolution, resolvedAt: new Date() },
    });
  }
}