import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { dataSourceOptions } from './data-source';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),

    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      autoLoadEntities: true,
    }),

    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
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
  providers: [MailService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule { }
