import { IsEnum, IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from "class-validator";
import { ReportReason } from "../enums/report-reason.enum";
import { ApiProperty } from "@nestjs/swagger";

export class CreateReportDto {
    @ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Id del usuario reportado'
    })
    @IsUUID()
    @IsNotEmpty()
    reportedId: string;

    @ApiProperty({
        example: ReportReason.DANGEROUS_DRIVING,
        description: 'Motivo del reporte'
    })
    @IsEnum(ReportReason)
    @IsNotEmpty()
    reason: ReportReason;

    @ApiProperty({
        example: 'Maneja demasiado rápido',
        description: 'Descripción del reporte'
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(255)
    description: string;
}