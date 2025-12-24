import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Journey } from '../journey/entities/journey.entity';
import { Message } from './entities/message.entity';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Journey]), UserModule],
  controllers: [MessageController],
  providers: [MessageService],
})
export class MessageModule { }
