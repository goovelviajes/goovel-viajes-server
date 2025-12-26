import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JourneyModule } from '../journey/journey.module';
import { UserModule } from '../user/user.module';
import { Message } from './entities/message.entity';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';

@Module({
  imports: [TypeOrmModule.forFeature([Message]), UserModule, JourneyModule],
  controllers: [MessageController],
  providers: [MessageService],
})
export class MessageModule { }
