import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from './prisma.service';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';

@Controller()
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  async health() {
    const rows: any[] = await this.prisma.$queryRaw`SELECT PostGIS_Version() AS postgis`;
    return { status: 'ok', postgis: rows[0].postgis };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Req() req: any) {
    return req.user;
  }

  @Get('admin-only')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  adminOnly() {
    return { secret: 'admins only' };
  }

    @Get('categories')
  categories() {
    return this.prisma.category.findMany({
      where: { active: true },
      orderBy: { id: 'asc' },
      include: { skills: { where: { active: true } } },
    });
  }
}