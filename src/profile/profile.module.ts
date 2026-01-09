import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './entities/profile.entity';
import { UserModule } from '../user/user.module';
import { UploadModule } from '../upload/upload.module';
import { RatingModule } from '../rating/rating.module';
import { JourneyModule } from '../journey/journey.module';

@Module({
  imports: [TypeOrmModule.forFeature([Profile]), UserModule, UploadModule, RatingModule, JourneyModule],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService]
})
export class ProfileModule { }
