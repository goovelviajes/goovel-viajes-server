import { JourneyRequest } from "src/journey-request/entities/journey-request.entity";
import { User } from "src/user/entities/user.entity";
import { Vehicle } from "src/vehicle/entities/vehicle.entity";
import { ProposalStatus } from "../enums/proposal-status.enum";
import { ApiProperty } from "@nestjs/swagger";

export class CreatedProposalResponseDto {
    @ApiProperty({
        description: 'Id de la propuesta',
        example: 'd3372dcf-e0ac-494d-a16a-b28d75f05b94'
    })
    id: string;

    @ApiProperty({
        description: 'Estado de la propuesta',
        example: ProposalStatus.SENT
    })
    status: ProposalStatus;

    @ApiProperty({
        description: 'Precio ofrecido',
        example: 4000
    })
    priceOffered: number;

    @ApiProperty({
        description: 'Conductor',
        example: {
            id: "dfea7f6d-de51-4558-9e65-4cae57265ef2"
        }
    })
    driver: User;

    @ApiProperty({
        description: 'Vehículo',
        example: {
            id: "9dfd2102-6f69-4bcf-919c-6e6d5fb98915",
            brand: "Mercedes",
            model: "Compressor",
            capacity: 4,
            color: "#000000",
            plate: "ABC125",
            type: "car",
            year: 1980
        }
    })
    vehicle: Vehicle

    @ApiProperty({
        description: 'Solicitud de viaje',
        example: {
            id: "0f5017b0-cbe5-47d1-bd2b-6b5654abf153",
            origin: {
                lat: -40.5214,
                lng: -40.521,
                name: "Benito Juarez"
            },
            destination: {
                lat: -38.0523,
                lng: -38.8532,
                name: "Chillar"
            },
            requestedTime: "2025-12-29T20:15:00.000Z",
            requestedSeats: 2,
            proposedPrice: "5000.00",
            type: "carpool",
            status: "ofered",
            createdAt: "2025-12-20T19:28:33.737Z",
            packageWeight: null,
            packageLength: null,
            packageWidth: null,
            packageHeight: null,
            packageDescription: null
        }
    })
    journeyRequest: JourneyRequest

    @ApiProperty({
        description: 'Fecha de creación',
        example: '2025-12-20T18:00:18.000Z'
    })
    createdAt: Date;
}