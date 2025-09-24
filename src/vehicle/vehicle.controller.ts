import { Body, Controller, Post, Get, UseGuards, Param, Patch } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { ActiveUser } from 'src/common/decorator/active-user.decorator';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { CreateVehicleDto } from './dtos/create-vehicle.dto';
import { TokenGuard } from 'src/auth/guard/token.guard';
import { CreatedResponseDto } from './dtos/created-response.dto';
import { VehicleResponseDto } from './dtos/vehicle-response.dto';
import { UpdateVehicleDto } from './dtos/update-vehicle.dto';
import { ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiForbiddenResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';

@Controller('vehicle')
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) { }

  @UseGuards(TokenGuard)
  @ApiOperation({ summary: 'Crear un nuevo vehiculo' })
  @ApiCreatedResponse({ type: VehicleResponseDto })
  @ApiConflictResponse({ description: 'Vehicle plate already exist' })
  @ApiInternalServerErrorResponse({ description: 'Error creating new vehicle' })
  @ApiBearerAuth('access-token')
  @Post()
  create(@ActiveUser() { id }: ActiveUserInterface, @Body() createVehicleDto: CreateVehicleDto) {
    return this.vehicleService.create(id, createVehicleDto)
  }

  @UseGuards(TokenGuard)
  @ApiOperation({ summary: 'Modificar datos del vehiculo' })
  @ApiOkResponse({ type: VehicleResponseDto })
  @ApiNotFoundResponse({ description: 'Vehicle not found' })
  @ApiForbiddenResponse({ description: 'You must be vehicle owner to modify it' })
  @ApiInternalServerErrorResponse({ description: 'Error modifying vehicle' })
  @ApiBearerAuth('access-token')
  @Patch(':id')
  modifyVehicle(@Param('id') vehicleId: string, @ActiveUser() { id: activeUserId }: ActiveUserInterface, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.vehicleService.modifyVehicle(vehicleId, activeUserId, updateVehicleDto)
  }

  @UseGuards(TokenGuard)
  @ApiOkResponse({ type: [VehicleResponseDto] })
  @ApiInternalServerErrorResponse({ description: 'Error getting vehicles list' })
  @Get()
  getVehicleList(@ActiveUser() { id }: ActiveUserInterface) {
    return this.vehicleService.getVehicleList(id)
  }
}
