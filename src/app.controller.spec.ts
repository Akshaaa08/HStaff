import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { PrismaService } from './prisma.service';

describe('AppController', () => {
  let appController: AppController;
  const prismaMock = {
    $queryRaw: jest.fn().mockResolvedValue([{ postgis_version: '3.4' }]),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  it('health() should return an ok status', async () => {
    const result = await appController.health();
    expect(result).toBeDefined();
  });
});