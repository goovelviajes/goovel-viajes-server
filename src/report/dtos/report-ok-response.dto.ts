import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ReportStatus } from "../enums/report-status.enum";

export class ReportOkResponseDto {
    @ApiProperty({ example: '123eb2cf28f-1597-4855-ab16-501d66fdfa66', description: 'Id del reporte' })
    id: string;

    @ApiProperty({
        example: {
            id: "e819066b-1da7-4960-bfde-8901d21cb8a9",
            name: "Tomas",
            lastname: "Cardenas",
            email: "tomicardenas96@gmail.com",
            profile: {
                id: "fa93c208-8a24-400d-86e9-2e77daeeab82",
                image: null
            }
        }, description: 'Id del reportador'
    })
    reporter: {
        id: string;
        name: string;
        lastname: string;
        email: string;
        profile: {
            id: string;
            image: string;
        };
    };

    @ApiProperty({
        example: {
            id: "4ac6eca4-353e-4ce0-b83a-1aa9cff4d3db",
            name: "Joaquin",
            lastname: "Fernandez",
            email: "joaco@gmail.com",
            profile: {
                id: "910896ca-373d-4349-973f-b99f4392ba9e",
                image: null
            }
        }, description: 'Id del reportado'
    })
    reported: {
        id: string;
        name: string;
        lastname: string;
        email: string;
        profile: {
            id: string;
            image: string;
        };
    };

    @ApiProperty({ example: 'Spam', description: 'Razon del reporte' })
    reason: string;

    @ApiPropertyOptional({ example: 'Spam', description: 'Descripcion del reporte' })
    description?: string;

    @ApiProperty({ example: 'pending', description: 'Estado del reporte' })
    status: ReportStatus;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z', description: 'Fecha de creacion del reporte' })
    createdAt: Date;
}