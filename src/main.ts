import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
   import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // removes fields not in the DTO
      forbidNonWhitelisted: true, // rejects requests with unknown fields (400)
      transform: true,            // converts types, e.g. "5" to 5
    }),
  );
   const config = new DocumentBuilder()
     .setTitle('H-Staff API')
     .setVersion('1.0')
     .addBearerAuth()
     .build();
   SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();