import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';
import { VehicleModule } from 'src/vehicle/vehicle.module';
import { Journey } from './entities/journey.entity';
import { JourneyController } from './journey.controller';
import { JourneyService } from './journey.service';
import { BookingModule } from 'src/booking/booking.module';

@Module({
  imports: [TypeOrmModule.forFeature([Journey]), forwardRef(() => UserModule), VehicleModule, forwardRef(() => BookingModule)],
  controllers: [JourneyController],
  providers: [JourneyService],
  exports: [JourneyService]
})
export class JourneyModule { }
