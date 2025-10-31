import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { JourneyStatus } from "../enums/journey-status.enum";
import { JourneyType } from "../enums/journey-type.enum";

export class JourneyOkResponseDto {
    @ApiProperty({
        description: 'Id del viaje',
        example: 'c61a97bb-7c7c-4ec6-b3e4-3f0bd140ba17'
    })
    id: string;

    @ApiProperty({
        description: 'Punto de partida',
        example: {
            "lat": -34.6037,
            "lng": -58.3816,
            "name": "Benito Juarez"
        }
    })
    origin: { name: string; lat: number; lng: number };

    @ApiProperty({
        description: 'Punto de llegada',
        example: {
            "lat": -34.6037,
            "lng": -58.3816,
            "name": "Tandil"
        }
    })
    destination: { name: string; lat: number; lng: number };

    @ApiProperty({
        description: 'Fecha de partida',
        example: '2027-10-10T03:00:00.000Z'
    })
    departureTime: Date;

    @ApiProperty({
        description: 'Asientos disponibles',
        example: 5
    })
    availableSeats: number;

    @ApiPropertyOptional({
        description: 'Precio por cada asiento',
        example: 4500
    })
    pricePerSeat: number;

    @ApiProperty({
        description: 'Fecha y hora de creacion de la publicación',
        example: '2025-10-15T19:14:56.625Z'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Tipo de viaje (carpool o package)',
        example: JourneyType.CARPOOL
    })
    type: JourneyType;

    @ApiProperty({
        description: 'Estado del viaje',
        example: JourneyStatus.PENDING
    })
    status: JourneyStatus;
}