import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CreateBookingDto {
    @ApiProperty({
        description: 'Id del viaje al que se quiere asociar la reserva',
        example: 'c61a97bb-7c7c-4ec6-b3e4-3f0bd140ba17',
        format: 'uuid',
    })
    @IsUUID()
    journeyId: string;

    @ApiPropertyOptional({
        description:
            'Cantidad de asientos a reservar. ' +
            'Obligatorio para viajes de tipo CARPOOL (entre 1 y 10). ' +
            'Debe omitirse para viajes de tipo PACKAGE.',
        example: 2,
        minimum: 1,
        maximum: 10,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(10)
    seatCount?: number;
}