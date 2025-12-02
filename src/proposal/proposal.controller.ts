import { Body, Controller, Post } from '@nestjs/common';
import { ProposalService } from './proposal.service';
import { CreateProposalDto } from './dtos/create-proposal.dto';
import { ApiBearerAuth, ApiCreatedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { TokenGuard } from '../auth/guard/token.guard';
import { ActiveUser } from '../common/decorator/active-user.decorator';
import { ActiveUserInterface } from '../common/interface/active-user.interface';
import { Proposal } from './entities/proposal.entity';

@UseGuards(TokenGuard)
@Controller('proposal')
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) { }

  @ApiOperation({ summary: 'Crear una propuesta para un viaje' })
  @ApiCreatedResponse({ description: 'Proposal successfully created', type: Proposal })
  @ApiNotFoundResponse({ description: 'Journey request not found' })
  @ApiForbiddenResponse({ description: 'User must be journey owner' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while creating proposal' })
  @ApiBearerAuth('access-token')
  @Post()
  async createProposal(@ActiveUser() { id: driverId }: ActiveUserInterface, @Body() dto: CreateProposalDto) {
    return this.proposalService.createProposal(driverId, dto);
  }
}
