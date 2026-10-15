import dns from 'node:dns';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';

// Configure resilient public DNS servers for external network calls
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore in restricted sandboxes
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for mobile apps, emulators and web dashboards
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe for all incoming DTO requests
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Configure global API route prefix with root and health excluded
  app.setGlobalPrefix('api/v1', {
    exclude: ['/', 'health'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 4000;

  await app.listen(port);
  logger.log(`🚀 Hourly Backend API server running on: http://localhost:${port}`);
  logger.log(`📡 Health Check: http://localhost:${port}/health`);
  logger.log(`🔐 Auth Endpoints: http://localhost:${port}/api/v1/auth`);
}

await bootstrap();
