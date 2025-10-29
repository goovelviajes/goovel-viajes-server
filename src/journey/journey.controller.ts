import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JourneyService } from './journey.service';
import { TokenGuard } from 'src/auth/guard/token.guard';
import { ActiveUser } from 'src/common/decorator/active-user.decorator';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { CreateJourneyDto } from './dtos/create-journey.dto';
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { JourneyResponseDto } from './dtos/journey-response.dto';
import { JourneyOkResponseDto } from './dtos/journey-ok-response.dto';

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
  @Get()
  getPendingJourneys() {
    return this.journeyService.getPendingJourneys()
  }
}
