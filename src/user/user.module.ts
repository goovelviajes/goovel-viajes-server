import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { MailModule } from '../mail/mail.module';
import { JourneyModule } from '../journey/journey.module';
import { ProposalModule } from '../proposal/proposal.module';
import { BookingModule } from '../booking/booking.module';
import { forwardRef } from '@nestjs/common';
import { JourneyRequestModule } from '../journey-request/journey-request.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), MailModule, forwardRef(() => JourneyModule), forwardRef(() => ProposalModule), forwardRef(() => BookingModule), forwardRef(() => JourneyRequestModule)],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }
