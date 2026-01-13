import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { ReportStatus } from "../enums/report-status.enum";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateReportDto {
    @ApiProperty({
        enum: ReportStatus,
        example: ReportStatus.PENDING,
        description: 'Estado del reporte'
    })
    @IsEnum(ReportStatus)
    status: ReportStatus;

    @ApiProperty({
        example: 'No cumplio con los terminos y condiciones',
        description: 'Explicacion del admin sobre su decision '
    })
    @IsString()
    @IsNotEmpty({ message: 'Admin note is required' })
    @MinLength(10, { message: 'Admin note must be at least 10 characters long' })
    adminNotes: string;

    @ApiProperty({
        example: true,
        description: 'Si se activa, el usuario sera baneado inmediatamente'
    })
    @IsOptional()
    @IsBoolean()
    banImmediately?: boolean;
}