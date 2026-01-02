import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../enums/booking-status.enum';
import { JourneyType } from 'src/journey/enums/journey-type.enum';

// Clase auxiliar para mejorar la documentación de las coordenadas
class LocationResponseDto {
    @ApiProperty({ example: -34.6037 })
    lat: number;

    @ApiProperty({ example: -58.3816 })
    lng: number;

    @ApiProperty({ example: 'Benito Juarez' })
    name: string;
}

class BookingUserResponseDto {
    @ApiProperty({ example: 'e819066b-1da7-4960-bfde-8901d21cb8a9' })
    id: string;

    @ApiProperty({ example: 'Tomas' })
    name: string;

    @ApiProperty({ example: 'Cardenas' })
    lastname: string;

    @ApiProperty({ example: 'tomicardenas96@gmail.com' })
    email: string;
}

class BookingJourneyResponseDto {
    @ApiProperty({
        description: 'Id del viaje asociado a la reserva',
        example: '05f8b021-9ac1-47b4-876e-e8ad5ae28db2',
    })
    id: string;

    @ApiProperty({
        description: 'Punto de partida del viaje',
        type: LocationResponseDto
    })
    origin: LocationResponseDto;

    @ApiProperty({
        description: 'Punto de llegada del viaje',
        type: LocationResponseDto
    })
    destination: LocationResponseDto;

    @ApiProperty({
        description: 'Fecha de partida del viaje',
        example: '2026-01-01T08:02:00.000Z',
    })
    departureTime: Date;

    @ApiProperty({
        description: 'Tipo de viaje (carpool o package)',
        example: JourneyType.CARPOOL,
        enum: JourneyType,
    })
    type: JourneyType;
}

export class BookingResponseDto {
    @ApiProperty({
        description: 'Id de la reserva',
        example: 'ca6b7fa7-3afc-4655-9534-7f2cd39f480a',
    })
    id: string;

    @ApiProperty({
        description: 'Cantidad de asientos reservados (solo para CARPOOL)',
        example: 1,
        nullable: true,
    })
    seatCount: number | null;

    @ApiProperty({
        description: 'Estado de la reserva',
        example: BookingStatus.PENDING,
        enum: BookingStatus,
    })
    status: BookingStatus;

    @ApiProperty({
        description: 'Indica si la reserva corresponde a un envío de paquete',
        example: false,
    })
    isShipping: boolean;

    @ApiProperty({
        description: 'Fecha y hora de creación de la reserva',
        example: '2026-01-02T13:53:15.555Z',
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Usuario que realiza la reserva',
        type: BookingUserResponseDto,
    })
    user: BookingUserResponseDto;

    @ApiProperty({
        description: 'Viaje al que pertenece la reserva',
        type: BookingJourneyResponseDto,
    })
    journey: BookingJourneyResponseDto;
}