import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { LocationDto } from "src/common/dtos/location.dto";
import { JourneyStatus } from "src/journey/enums/journey-status.enum";
import { JourneyType } from "src/journey/enums/journey-type.enum";
import { User } from "src/user/entities/user.entity";

export class CreatedResponseRequestDto {
    @ApiProperty({ example: '5b0b8098-4614-472d-88d7-d380563e6916', description: 'Id de la nueva solicitud de viaje' })
    id: string;

    @ApiProperty({
        type: LocationDto,
        example: {
            name: 'Benito Juarez',
            lat: -40.5214,
            lng: -40.5531
        }
    })
    origin: LocationDto;

    @ApiProperty({
        type: LocationDto,
        example: {
            name: 'Tandil',
            lat: -38.0523,
            lng: -38.8532
        }
    })
    destination: LocationDto;

    @ApiProperty({ example: '2025-09-30T00:00:00', description: 'Horario de partida solicitado', format: 'datetime' })
    requestedTime: string;

    @ApiProperty({ example: 5000, description: 'Precio propuesto para realizar el viaje' })
    proposedPrice: number;

    @ApiProperty({ example: 'carpool', description: 'Tipo de solicitud (CARPOOL o PACKAGE)' })
    type: JourneyType;

    @ApiProperty({ example: 4, description: 'Asientos solicitados' })
    requestedSeats: number;

    @ApiProperty({ example: 'pending', description: 'Estado de la petición' })
    status: JourneyStatus;

    @ApiProperty({ example: '2025-09-29T19:10:06.959Z', description: 'Fecha de creacion de la solicitud de viaje' })
    createdAt: string;

    @ApiProperty({ example: 15, description: 'Peso del paquete representado en kilogramos (en caso que el tipo de solicitud sea PACKAGE)' })
    packageWeight: number;

    @ApiProperty({ example: 40, description: 'Longitud del paquete representado en centimetros (en caso que el tipo de solicitud sea PACKAGE)' })
    packageLength: number;

    @ApiProperty({ example: 20, description: 'Ancho del paquete representado en centimetros (en caso que el tipo de solicitud sea PACKAGE)' })
    packageWidth: number;

    @ApiProperty({ example: 34, description: 'Alto del paquete representado en centimetros (en caso que el tipo de solicitud sea PACKAGE)' })
    packageHeight: number;

    @ApiProperty({ example: 'Paquete con contenido muy fragil', description: 'Descripcion extra del paquete (en caso que el tipo de solicitud sea PACKAGE)' })
    packageDescription: string;

    @ApiProperty({
        example: {
            id: "a2243e00-acd3-4c75-bf9d-ee0b445103cb",
            name: "Micaela",
            lastname: "Aguilar",
            email: "mica@gmail.com",
            password: "$2b$10$1ej3VlsQPpNV7j4rcYId2egH3RAYzrIn1NqWn9ZJJrCQRTucK7Hf6",
            birthdate: "2000-07-15",
            createdAt: "2025-09-22T17:20:45.964Z",
            updatedAt: "2025-09-22T17:20:45.964Z",
            deletedAt: null,
            role: "member"
        },
        description: 'Usuario solicitante (usuario activo)'
    })
    user: User;
}