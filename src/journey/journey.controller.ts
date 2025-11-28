import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { TokenGuard } from 'src/auth/guard/token.guard';
import { ActiveUser } from 'src/common/decorator/active-user.decorator';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { CreateProposalDto } from '../proposal/dtos/create-proposal.dto';
import { CreateJourneyDto } from './dtos/create-journey.dto';
import { JourneyOkResponseDto } from './dtos/journey-ok-response.dto';
import { JourneyResponseDto } from './dtos/journey-response.dto';
import { JourneyService } from './journey.service';

@Controller('journey')
export class JourneyController {
  constructor(private readonly journeyService: JourneyService) { }

  @UseGuards(TokenGuard)
  @ApiOperation({ summary: 'Crear un nuevo viaje (para CARPOOL o PACKAGE)' })
  @ApiCreatedResponse({
    description: "Journey successfully created",
    type: JourneyResponseDto,
  })
  @ApiConflictResponse({ description: 'Journey cannot be repeated' })
  @ApiForbiddenResponse({ description: 'Only one of your own vehicles can be selected' })
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while creating new journey' })
  @ApiBearerAuth('access-token')
  @Post()
  createJourney(@ActiveUser() activeUser: ActiveUserInterface, @Body() createJourneyDto: CreateJourneyDto) {
    return this.journeyService.createJourney(activeUser, createJourneyDto)
  }

  @ApiOperation({ summary: 'Obtener un listado de los viajes publicados que tengan un estado pendiente' })
  @ApiOkResponse({ type: [JourneyOkResponseDto] })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while getting list of pending journeys' })
  @ApiBearerAuth('access-token')
  @UseGuards(TokenGuard)
  @Get()
  getPendingJourneys() {
    return this.journeyService.getPendingJourneys()
  }

  @ApiOperation({ summary: 'Cancelar un viaje publicado' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Journey not found' })
  @ApiBadRequestResponse({ description: 'Only a journey with pending status can be cancelled' })
  @ApiForbiddenResponse({ description: 'User must be journey owner' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while cancelling journey' })
  @UseGuards(TokenGuard)
  @HttpCode(204)
  @Patch(':id')
  cancelJourney(@Param('id', ParseUUIDPipe) id: string, @ActiveUser() { id: activeUserId }: ActiveUserInterface) {
    return this.journeyService.cancelJourney(id, activeUserId);
  }

  @ApiOperation({ summary: 'Obtener todos los viajes publicados por el usuario activo' })
  @ApiOkResponse({ type: [JourneyOkResponseDto] })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while getting own journeys' })
  @ApiBearerAuth('access-token')
  @UseGuards(TokenGuard)
  @Get('own')
  getOwnjourneys(@ActiveUser() { id }: ActiveUserInterface) {
    return this.journeyService.getOwnjourneys(id);
  }

  @ApiOperation({ summary: 'Marcar un viaje como completado' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'Journey not found' })
  @ApiForbiddenResponse({ description: 'User must be journey owner' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while marking journey as completed' })
  @UseGuards(TokenGuard)
  @HttpCode(204)
  @Patch(':id/completed')
  markJourneyAsCompleted(@Param('id', ParseUUIDPipe) id: string, @ActiveUser() { id: activeUserId }: ActiveUserInterface) {
    return this.journeyService.markJourneyAsCompleted(id, activeUserId);
  }


}
