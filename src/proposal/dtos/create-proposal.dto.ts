import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateProposalDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID de la solicitud de viaje' })
    @IsNotEmpty()
    @IsUUID()
    requestId: string;

    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del vehículo' })
    @IsNotEmpty()
    @IsUUID()
    vehicleId: string;
}