import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // removes fields not in the DTO
      forbidNonWhitelisted: true, // rejects requests with unknown fields (400)
      transform: true,            // converts types, e.g. "5" to 5
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();