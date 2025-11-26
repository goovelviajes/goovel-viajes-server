import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JourneyRequestService } from './journey-request.service';
import { ActiveUser } from 'src/common/decorator/active-user.decorator';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { CreateRequestDto } from './dtos/create-request.dto';
import { TokenGuard } from 'src/auth/guard/token.guard';
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { CreatedResponseRequestDto } from './dtos/request-response.dto';
import { FindRequestsResponseDto } from './dtos/find-requests-response.dto';

@Controller('journey-request')
export class JourneyRequestController {
  constructor(private readonly journeyRequestService: JourneyRequestService) { }

  @ApiOperation({ summary: 'Crear una solicitud de viaje' })
  @ApiCreatedResponse({ type: CreatedResponseRequestDto })
  @ApiConflictResponse({ description: 'Request cannot be repeated' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while creating journey request' })
  @ApiBearerAuth('access-token')
  @UseGuards(TokenGuard)
  @Post()
  createRequest(@ActiveUser() activeUser: ActiveUserInterface, @Body() requestDto: CreateRequestDto) {
    return this.journeyRequestService.createRequest(activeUser, requestDto)
  }

  @ApiOperation({ summary: 'Obtener todas las solicitudes de viaje publicadas' })
  @ApiOkResponse({ description: 'List of published requests by active user', type: [FindRequestsResponseDto] })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while getting all journey requests' })
  @ApiBearerAuth('access-token')
  @UseGuards(TokenGuard)
  @Get()
  findAll(@ActiveUser() activeUser: ActiveUserInterface) {
    return this.journeyRequestService.findAll(activeUser.id)
  }

  @ApiOperation({ summary: 'Cancelar una solicitud de viaje' })
  @ApiOkResponse({ description: 'Journey request cancelled successfully' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while cancelling journey request' })
  @ApiBearerAuth('access-token')
  @UseGuards(TokenGuard)
  @Patch(':id')
  cancelJourneyRequest(@ActiveUser() activeUser: ActiveUserInterface, @Param('id') journeyRequestId: string) {
    return this.journeyRequestService.cancelJourneyRequest(activeUser.id, journeyRequestId)
  }
}
