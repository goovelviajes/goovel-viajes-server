import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import 'dotenv/config';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ProfileModule } from './profile/profile.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { NotificationModule } from './notification/notification.module';
import { ReportModule } from './report/report.module';
import { MessageModule } from './message/message.module';
import { RatingModule } from './rating/rating.module';
import { JourneyModule } from './journey/journey.module';
import { BookingModule } from './booking/booking.module';
import { JourneyRequestModule } from './journey-request/journey-request.module';
import { ProposalModule } from './proposal/proposal.module';

const isProductionEnviroment = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    // Para verificar en que enviroment se esta ejecutando la app.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    // Conexion con la DB.
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: 'goovel',
      entities: [join(__dirname, '/**/*.entity{.js,.ts}')],
      synchronize: !isProductionEnviroment,
      // dropSchema: true
    }),
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
