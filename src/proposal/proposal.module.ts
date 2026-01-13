import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from './entities/proposal.entity';
import { ProposalController } from './proposal.controller';
import { ProposalService } from './proposal.service';
import { UserModule } from '../user/user.module';
import { JourneyModule } from '../journey/journey.module';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal]), forwardRef(() => UserModule), JourneyModule],
  controllers: [ProposalController],
  providers: [ProposalService],
  exports: [ProposalService]
})
export class ProposalModule { }
