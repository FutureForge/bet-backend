import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { ResponseInterceptor } from './interceptor/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = new Logger('NestApplication');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.setGlobalPrefix('api');

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const port = 7777;
  
  logger.log(`Starting server on port: ${port} (type: ${typeof port})`);
  
  await app.listen(port);

  logger.log(
    `Application environment is ${process.env.NODE_ENV}. Running on: ${await app.getUrl()}`,
  );
}
bootstrap();
