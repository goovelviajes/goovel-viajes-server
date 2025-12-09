import { Module } from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rating } from './entities/rating.entity';
import { JourneyModule } from 'src/journey/journey.module';
import { UserModule } from 'src/user/user.module';
import { BookingModule } from 'src/booking/booking.module';

@Module({
  imports: [TypeOrmModule.forFeature([Rating]), JourneyModule, UserModule, BookingModule],
  controllers: [RatingController],
  providers: [RatingService],
})
export class RatingModule { }
