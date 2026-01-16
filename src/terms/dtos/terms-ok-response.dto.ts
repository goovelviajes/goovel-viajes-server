import { ApiProperty } from '@nestjs/swagger';

export class TermsOkResponseDto {
    @ApiProperty({ description: 'Id de la version', example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ description: 'Numero de version', example: '1.0.0' })
    versionNumber: string;

    @ApiProperty({ description: 'Contenido de la version', example: 'Contenido de la version' })
    content: string;

    @ApiProperty({ description: 'Indica si la version es la mas reciente', example: true })
    isActive: boolean;

    @ApiProperty({ description: 'Fecha de creacion', example: '2026-01-16T19:59:25.000Z' })
    createdAt: Date;
}