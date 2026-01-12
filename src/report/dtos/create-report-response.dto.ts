import { ApiProperty } from "@nestjs/swagger";
import { ReportReason } from "../enums/report-reason.enum";
import { ReportStatus } from "../enums/report-status.enum";

export class CreateReportResponseDto {
    @ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Id del reporte'
    })
    id: string;

    @ApiProperty({
        example: ReportReason.DANGEROUS_DRIVING,
        description: 'Motivo del reporte'
    })
    reason: ReportReason;

    @ApiProperty({
        example: 'Maneja demasiado rápido',
        description: 'Descripción del reporte'
    })
    description?: string;

    @ApiProperty({
        example: '2022-01-01T00:00:00.000Z',
        description: 'Fecha de creación del reporte'
    })
    createdAt: Date;

    @ApiProperty({
        example: ReportStatus.PENDING,
        description: 'Estado del reporte'
    })
    status: ReportStatus;

    @ApiProperty({
        type: 'object',
        properties: {
            id: { type: 'string' },
        },
    })
    reporter: {
        id: string;
    };

    @ApiProperty({
        type: 'object',
        properties: {
            id: { type: 'string' },
        },
    })
    reported: {
        id: string;
    };
}