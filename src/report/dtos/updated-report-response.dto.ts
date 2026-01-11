import { ApiProperty } from "@nestjs/swagger";
import { ReportStatus } from "../enums/report-status.enum";

export class UpdatedReportResponseDto {
    @ApiProperty({ example: 'Report updated successfully', description: 'Mensaje de confirmación' })
    message: string;

    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID del reporte actualizado' })
    id: string;

    @ApiProperty({ example: ReportStatus.RESOLVED, description: 'Estado del reporte' })
    status: ReportStatus;

    @ApiProperty({ example: 'Admin notes', description: 'Notas del administrador' })
    adminNotes: string;
}