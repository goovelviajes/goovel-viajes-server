import { Body, Controller, Get, Param, ParseArrayPipe, ParseEnumPipe, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ProposalService } from './proposal.service';
import { CreateProposalDto } from './dtos/create-proposal.dto';
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, OmitType } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { TokenGuard } from '../auth/guard/token.guard';
import { ActiveUser } from '../common/decorator/active-user.decorator';
import { ActiveUserInterface } from '../common/interface/active-user.interface';
import { Proposal } from './entities/proposal.entity';
import { ProposalsOkResponseDto } from './dtos/proposals-ok-response.dto';
import { ProposalStatus } from './enums/proposal-status.enum';

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

  @ApiOperation({ summary: 'Aceptar una propuesta' })
  @ApiCreatedResponse({ description: 'Proposal successfully accepted', type: Proposal })
  @ApiNotFoundResponse({ description: 'Proposal not found' })
  @ApiForbiddenResponse({ description: 'User must be journey owner' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while accepting proposal' })
  @ApiBearerAuth('access-token')
  @Patch(':id/accept')
  async acceptProposal(
    @ActiveUser() { id: passengerId }: ActiveUserInterface,
    @Param('id', ParseUUIDPipe) proposalId: string
  ) {
    return this.proposalService.acceptProposal(passengerId, proposalId);
  }

  @ApiOperation({ summary: 'Rechazar una propuesta' })
  @ApiCreatedResponse({ description: 'Proposal successfully rejected', type: Proposal })
  @ApiNotFoundResponse({ description: 'Proposal not found' })
  @ApiForbiddenResponse({ description: 'User must be journey owner' })
  @ApiConflictResponse({ description: 'Proposal must be in SENT status' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while rejecting proposal' })
  @ApiBearerAuth('access-token')
  @Patch(':id/reject')
  async rejectProposal(
    @ActiveUser() { id: passengerId }: ActiveUserInterface,
    @Param('id', ParseUUIDPipe) proposalId: string
  ) {
    return this.proposalService.rejectProposal(passengerId, proposalId);
  }

  @ApiOperation({ summary: 'Obtener propuestas pendientes' })
  @ApiOkResponse({ description: 'Pending proposals list', type: [ProposalsOkResponseDto] })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while getting proposals' })
  @ApiBearerAuth('access-token')
  @Get('pending')
  getPendingProposals(@ActiveUser() { id: userId }: ActiveUserInterface) {
    return this.proposalService.getPendingProposals(userId);
  }

  @ApiOperation({ summary: 'Obtener propuestas rechazadas y canceladas' })
  @ApiOkResponse({ description: 'Rejected and cancelled proposals list', type: [ProposalsOkResponseDto] })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while getting proposals' })
  @ApiBearerAuth('access-token')
  @Get('rejected')
  getRejectedAndCancelledProposals(@ActiveUser() { id: userId }: ActiveUserInterface) {
    return this.proposalService.getRejectedAndCancelledProposals(userId);
  }

  @ApiOperation({ summary: 'Obtener propuestas hechas por el conductor' })
  @ApiOkResponse({ description: 'Proposals list', type: [OmitType(ProposalsOkResponseDto, ['driver'])] })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while getting proposals' })
  @ApiBearerAuth('access-token')
  @Get('driver/made')
  getDriverProposals(
    @ActiveUser() { id: driverId }: ActiveUserInterface,
    @Query('status') status?: ProposalStatus | ProposalStatus[]
  ) {
    return this.proposalService.getDriverProposals(driverId, status);
  }
}
