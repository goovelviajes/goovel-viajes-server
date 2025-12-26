import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { BookingModule } from './booking/booking.module';
import { JourneyRequestModule } from './journey-request/journey-request.module';
import { JourneyModule } from './journey/journey.module';
import { MailModule } from './mail/mail.module';
import { MailService } from './mail/mail.service';
import { MessageModule } from './message/message.module';
import { NotificationModule } from './notification/notification.module';
import { ProfileModule } from './profile/profile.module';
import { ProposalModule } from './proposal/proposal.module';
import { RatingModule } from './rating/rating.module';
import { ReportModule } from './report/report.module';
import { UserModule } from './user/user.module';
import { VehicleModule } from './vehicle/vehicle.module';


@Module({
  imports: [
    // Para verificar en que enviroment se esta ejecutando la app.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),

    // Conexion con la DB.
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          type: 'mysql',
          host: config.get<string>('DB_HOST'),
          port: config.get<number>('DB_PORT'),
          username: config.get<string>('DB_USERNAME'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_NAME'),

          ssl: config.get<string>('SSL_ENABLED') === 'true'
            ? { rejectUnauthorized: false }
            : false,

          synchronize: config.get<string>('NODE_ENV') === 'development',
          autoLoadEntities: true,
          entities: [join(__dirname, '/**/*.entity{.ts,.js}')],
          logging: config.get<string>('NODE_ENV') === 'development' ? 'all' : ['error'],
        };
      },
    }),

    EventEmitterModule.forRoot(),
    UserModule,
    AuthModule,
    ProfileModule,
    VehicleModule,
    NotificationModule,
    ReportModule,
    MessageModule,
    RatingModule,
    JourneyModule,
    BookingModule,
    JourneyRequestModule,
    ProposalModule,
    MailModule,
  ],
  controllers: [],
  providers: [MailService],
})
export class AppModule { }
