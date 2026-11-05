import helmet from 'helmet';
import { json } from 'express';
import { Reflector } from '@nestjs/core';
import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
export function setup(app: INestApplication) {
  app.use(helmet());
  app.use(json({ limit: '128kb', inflate: false }));
  app.setGlobalPrefix('v1/api');
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );
  app.enableShutdownHooks();
}
