import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    // allow credentials so browser will accept HttpOnly auth cookie from API
    app.enableCors({ origin: true, credentials: true });
  const port = process.env.PORT || 3000;
  await app.listen(port);
    Logger.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
