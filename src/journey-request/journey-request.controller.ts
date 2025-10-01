import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JourneyRequestService } from './journey-request.service';
import { ActiveUser } from 'src/common/decorator/active-user.decorator';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { CreateRequestDto } from './dtos/create-request.dto';
import { TokenGuard } from 'src/auth/guard/token.guard';
import { ApiConflictResponse, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiOperation } from '@nestjs/swagger';
import { CreatedResponseRequestDto } from './dtos/request-response.dto';

@Controller('journey-request')
export class JourneyRequestController {
  constructor(private readonly journeyRequestService: JourneyRequestService) { }

  @ApiOperation({ summary: 'Crear una solicitud de viaje' })
  @ApiCreatedResponse({ type: CreatedResponseRequestDto })
  @ApiConflictResponse({ description: 'Request cannot be repeated' })
  @ApiInternalServerErrorResponse({ description: 'Unexpected error while creating journey request' })
  @UseGuards(TokenGuard)
  @Post()
  createRequest(@ActiveUser() activeUser: ActiveUserInterface, @Body() requestDto: CreateRequestDto) {
    return this.journeyRequestService.createRequest(activeUser, requestDto)
  }
}
