import { Module } from '@nestjs/common';
import { TermsService } from './terms.service';
import { TermsController } from './terms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TermsVersion } from './entities/terms-version.entity';
import { TermsAcceptance } from './entities/terms-acceptance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TermsVersion, TermsAcceptance])],
  controllers: [TermsController],
  providers: [TermsService],
  exports: [TermsService],
})
export class TermsModule { }