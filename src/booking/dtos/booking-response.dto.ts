import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../enums/booking-status.enum';
import { JourneyType } from 'src/journey/enums/journey-type.enum';

class BookingUserResponseDto {
    @ApiProperty({ example: '809e5c79-4291-4a0f-88b7-e33eed183c4e' })
    id: string;

    @ApiProperty({ example: 'Francisco' })
    name: string;

    @ApiProperty({ example: 'Gimenez' })
    lastname: string;
}

class BookingJourneyResponseDto {
    @ApiProperty({
        description: 'Id del viaje asociado a la reserva',
        example: 'c61a97bb-7c7c-4ec6-b3e4-3f0bd140ba17',
    })
    id: string;

    @ApiProperty({
        description: 'Punto de partida del viaje',
        example: {
            lat: -34.6037,
            lng: -58.3816,
            name: 'Benito Juarez',
        },
    })
    origin: { name: string; lat: number; lng: number };

    @ApiProperty({
        description: 'Punto de llegada del viaje',
        example: {
            lat: -34.6037,
            lng: -58.3816,
            name: 'Tandil',
        },
    })
    destination: { name: string; lat: number; lng: number };

    @ApiProperty({
        description: 'Fecha de partida del viaje',
        example: '2027-10-10T03:00:00.000Z',
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
        example: 'e91a9a4e-5a6c-4b3b-9c8f-123456789abc',
    })
    id: string;

    @ApiProperty({
        description: 'Cantidad de asientos reservados (solo para CARPOOL)',
        example: 2,
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
        example: '2025-10-15T19:14:56.625Z',
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