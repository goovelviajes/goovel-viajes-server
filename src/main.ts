import { ClassSerializerInterceptor, Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import 'dotenv/config';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Configuración de Logs Optimizada
    logger: WinstonModule.createLogger({
      transports: [
        // Consola: Legible para humanos
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, context }) => {
              return `[${timestamp}] ${level}: [${context || 'App'}] ${message}`;
            }),
          ),
        }),
        // Archivos: Formato JSON para análisis profesional
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxFiles: '30d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    })
  });

  const logger = new Logger('Bootstrap');

  // --- MIDDLEWARES DE SEGURIDAD Y RENDIMIENTO ---
  app.use(helmet());
  app.use(compression());

  // CORS Protegido
  const origin = process.env.FRONTEND_URL;
  app.enableCors({
    origin: origin ? origin.split(',') : false, // False bloquea si no hay origen definido
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Pipes Globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger (solo desarrollo)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Goovel API')
      .setDescription('Documentación de endpoints de Goovel')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
        'access-token',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  // Interceptores Globales
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new LoggingInterceptor(),
  );

  // Confianza en el Proxy (Vital para obtener IPs reales en la nube)
  const httpAdapter = app.getHttpAdapter();
  if (typeof httpAdapter.getInstance === 'function') {
    httpAdapter.getInstance().set('trust proxy', 1);
  }

  const port = process.env.PORT || 3050;
  await app.listen(port);

  // Log de inicio para saber que todo arrancó bien
  logger.log(`🚀 Goovel API is running`);
}
bootstrap();