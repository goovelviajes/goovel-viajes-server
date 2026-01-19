import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from '../user/user.module';
import { ProfileModule } from '../profile/profile.module';
import { MailModule } from '../mail/mail.module';
import { RatingModule } from '../rating/rating.module';
import { JourneyModule } from '../journey/journey.module';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.SECRET_KEY,
      signOptions: { expiresIn: '14d' },
    }),
    UserModule,
    ProfileModule,
    MailModule,
    RatingModule,
    JourneyModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule { }
