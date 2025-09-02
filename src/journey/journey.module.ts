import { Module } from '@nestjs/common';
import { JourneyService } from './journey.service';
import { JourneyController } from './journey.controller';

@Module({
  controllers: [JourneyController],
  providers: [JourneyService],
})
export class JourneyModule {}
