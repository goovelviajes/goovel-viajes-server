import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { BookingService } from './booking.service';
import { TokenGuard } from 'src/auth/guard/token.guard';
import { ActiveUser } from 'src/common/decorator/active-user.decorator';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { CreateBookingDto } from './dtos/create-booking.dto';
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { Booking } from './entities/booking.entity';
import { BookingResponseDto } from './dtos/booking-response.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) { }

  @UseGuards(TokenGuard)
  @ApiOperation({
    summary: 'Crear una nueva reserva para un viaje (CARPOOL o PACKAGE)',
    description:
      'Permite crear una reserva asociada a un viaje. ' +
      'Para viajes CARPOOL el campo seatCount es obligatorio (entre 1 y 10). ' +
      'Para viajes PACKAGE no se debe enviar seatCount; en ese caso la reserva se marca como envío (isShipping = true).',
  })
  @ApiCreatedResponse({
    description: 'Booking successfully created',
    type: BookingResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      "Se produce cuando: " +
      "- El viaje es de tipo PACKAGE y se envía el campo seatCount (\"Property seatCount shouldn't exist\"), o " +
      "- El viaje es de tipo CARPOOL y no se envía seatCount (\"Field seatCount is missing\"), o " +
      '- Los datos del DTO no cumplen las validaciones (UUID, rango de seatCount, etc.).',
  })
  @ApiConflictResponse({
    description:
      'No seats available: la suma de los asientos ya reservados más seatCount excede los asientos disponibles del viaje.' +
      'Booking already exists: la reserva ya existe para el usuario y el viaje.',
  })
  @ApiNotFoundResponse({
    description:
      'Journey not found: el viaje asociado a journeyId no existe o fue eliminado.',
  })
  @ApiInternalServerErrorResponse({
    description:
      'Unexpected error while creating new booking: error inesperado al verificar asientos o guardar la reserva.',
  })
  @ApiBearerAuth('access-token')
  @Post()
  create(
    @ActiveUser() activeUser: ActiveUserInterface,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingService.create(activeUser, createBookingDto);
  }
}
