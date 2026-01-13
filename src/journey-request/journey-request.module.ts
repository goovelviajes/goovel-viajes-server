import { Module } from '@nestjs/common';
import { JourneyRequestService } from './journey-request.service';
import { JourneyRequestController } from './journey-request.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JourneyRequest } from './entities/journey-request.entity';
import { UserModule } from '../user/user.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [TypeOrmModule.forFeature([JourneyRequest]), forwardRef(() => UserModule)],
  controllers: [JourneyRequestController],
  providers: [JourneyRequestService],
  exports: [JourneyRequestService]
})
export class JourneyRequestModule { }
