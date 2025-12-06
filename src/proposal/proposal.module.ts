import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from './entities/proposal.entity';
import { ProposalController } from './proposal.controller';
import { ProposalService } from './proposal.service';
import { UserModule } from 'src/user/user.module';
import { JourneyModule } from 'src/journey/journey.module';

@Module({
  imports: [TypeOrmModule.forFeature([Proposal]), UserModule, JourneyModule],
  controllers: [ProposalController],
  providers: [ProposalService],
})
export class ProposalModule { }
