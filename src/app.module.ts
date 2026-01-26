import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { TokenGuard } from './auth/guard/token.guard';
import { BookingModule } from './booking/booking.module';
import { UserExistsGuard } from './common/guards/user-exists.guard';
import { dataSourceOptions } from './data-source';
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
import { User } from './user/entities/user.entity';
import { UserModule } from './user/user.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { TermsModule } from './terms/terms.module';
import { TermsGuard } from './auth/guard/terms.guard';
import { BanGuard } from './auth/guard/ban.guard';
import { AppController } from './app.controller';
import { HealthModule } from './health/health.module';

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

    TypeOrmModule.forFeature([User]),

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
    TermsModule,
    HealthModule,
  ],
  controllers: [
    AppController
  ],
  providers: [
    MailService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard // 1. ¿Viene muy rápido?
    },
    {
      provide: APP_GUARD,
      useClass: TokenGuard // 2. ¿Quién es?
    },
    {
      provide: APP_GUARD,
      useClass: UserExistsGuard // 3. ¿Todavía existe?
    },
    {
      provide: APP_GUARD,
      useClass: BanGuard // 4. ¿Tiene permiso de acceso (no baneado)?
    },
    {
      provide: APP_GUARD,
      useClass: TermsGuard // 5. ¿Aceptó los términos?
    }
  ],
})
export class AppModule { }
