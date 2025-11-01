import { Module } from '@nestjs/common';
import { JourneyRequestService } from './journey-request.service';
import { JourneyRequestController } from './journey-request.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JourneyRequest } from './entities/journey-request.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([JourneyRequest]), UserModule],
  controllers: [JourneyRequestController],
  providers: [JourneyRequestService],
})
export class JourneyRequestModule { }
