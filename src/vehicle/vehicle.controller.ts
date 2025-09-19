import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { ActiveUser } from 'src/common/decorator/active-user.decorator';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { CreateVehicleDto } from './dtos/create-vehicle.dto';
import { TokenGuard } from 'src/auth/guard/token.guard';
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { CreatedResponseDto } from './dtos/created-response.dto';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) { }

  @UseGuards(TokenGuard)
  @ApiOperation({ summary: 'Crear un nuevo vehiculo' })
  @ApiCreatedResponse({ type: CreatedResponseDto })
  @ApiConflictResponse({ description: 'Vehicle plate already exist' })
  @ApiInternalServerErrorResponse({ description: 'Error creating new vehicle' })
  @ApiBearerAuth('access-token')
  @Post()
  create(@ActiveUser() { id }: ActiveUserInterface, @Body() createVehicleDto: CreateVehicleDto) {
    return this.vehicleService.create(id, createVehicleDto)
  }

  @UseGuards(TokenGuard)
  @ApiOkResponse({type: ''})
  @ApiInternalServerErrorResponse({description: 'Error getting vehicles list'})
  @Get()
  getVehicleList(@ActiveUser() { id }: ActiveUserInterface) {
    return this.vehicleService.getVehicleList(id)
  }
}
