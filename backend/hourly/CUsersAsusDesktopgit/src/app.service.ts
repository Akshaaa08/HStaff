import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot() {
    return {
      status: 'ok',
      service: 'Hourly Backend API',
      version: '1.0.0',
      database: 'Firebase (Firestore & Auth)',
      documentation: '/docs',
    };
  }

  getHealth() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
