import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';

import { HttpAdapterHost } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.enableShutdownHooks();
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  
  app.enableCors();
  const config = new DocumentBuilder()
    .setTitle('Incident Management API')
    .setDescription('The Intelligent Incident & Log Management Platform API')
    .setVersion('1.0')
    .addTag('logs')
    .addTag('incidents')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);

}
bootstrap();
