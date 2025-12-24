import { ApiProperty } from "@nestjs/swagger";

export class CreatedMessageResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Id del mensaje' })
    id: string;

    @ApiProperty({ example: 'Hello', description: 'Contenido del mensaje' })
    content: string;

    @ApiProperty({ example: '713c3f3b-f708-4751-ac91-72d86c714c2f', description: 'Id del remitente' })
    sender: string;

    @ApiProperty({ example: '847d784a-40b1-4ae2-8106-5ed6e97e55a0', description: 'Id del destinatario' })
    receiver: string;

    @ApiProperty({ example: '06f82bc5-658e-45c0-8f56-1a1870491c58', description: 'Id del viaje' })
    journey: string;

    @ApiProperty({ example: false, description: 'Indica si el mensaje ha sido leído' })
    isRead: boolean;

    @ApiProperty({ example: '2025-12-24T15:18:05.123Z', description: 'Fecha de creación del mensaje' })
    createdAt: Date;
}