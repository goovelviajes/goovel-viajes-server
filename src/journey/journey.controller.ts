import { Body, Controller, Delete, HttpCode, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { JourneyService } from './journey.service';
import { TokenGuard } from 'src/auth/guard/token.guard';
import { ActiveUser } from 'src/common/decorator/active-user.decorator';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { CreateJourneyDto } from './dtos/create-journey.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { JourneyResponseDto } from './dtos/journey-response.dto';

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
}
