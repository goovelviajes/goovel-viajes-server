import { IsEnum, IsNotEmpty, IsString, MinLength } from "class-validator";
import { ReportStatus } from "../enums/report-status.enum";

export class UpdateReportDto {
    @IsEnum(ReportStatus)
    status: ReportStatus;

    @IsString()
    @IsNotEmpty({ message: 'Admin note is required' })
    @MinLength(10, { message: 'Admin note must be at least 10 characters long' })
    adminNotes: string;

}