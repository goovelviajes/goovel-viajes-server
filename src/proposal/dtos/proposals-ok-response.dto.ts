import { ApiProperty } from "@nestjs/swagger";
import { JourneyRequest } from "src/journey-request/entities/journey-request.entity";
import { User } from "src/user/entities/user.entity";
import { Vehicle } from "src/vehicle/entities/vehicle.entity";
import { VehicleType } from "src/vehicle/enums/vehicle-type.enum";
import { ProposalStatus } from "../enums/proposal-status.enum";

export class ProposalsOkResponseDto {
    @ApiProperty({
        example: "123e4567-e89b-12d3-a456-426614174000",
        description: "ID de la propuesta"
    })
    id: string;

    @ApiProperty({
        example: "123e4567-e89b-12d3-a456-426614174000",
        description: "Precio ofrecido"
    })
    priceOffered: string;

    @ApiProperty({
        example: "2025-12-02T16:38:12.123Z",
        description: "Fecha de creación de la propuesta"
    })
    createdAt: Date;

    @ApiProperty({
        example: {
            id: "422e5790-dbf3-4956-9592-5d4d1c432bfb",
            origin: {
                lat: -40.5214,
                lng: -40.521,
                name: "Benito Juarez"
            },
            destination: {
                lat: -38.0523,
                lng: -38.8532,
                name: "Necochea"
            },
            requestedTime: "2025-12-24T20:15:00.000Z",
            requestedSeats: 3,
            proposedPrice: "5000.00",
            type: "package",
            status: "ofered",
            createdAt: "2025-12-02T18:53:59.100Z",
            packageWeight: "1",
            packageLength: "1",
            packageWidth: "2",
            packageHeight: "30",
            packageDescription: null,
            user: {
                id: "713c3f3b-f708-4751-ac91-72d86c714c2f",
                name: "Carlos",
                lastname: "Rodriguez",
                email: "carlos@gmail.com",
                password: "$2b$10$rwVD0yG2HJ63ON/J1BXxle3UybmSgAp3vNMXS9kOwevRp6/eMaws2",
                birthdate: "2000-02-29",
                createdAt: "2025-11-19T19:45:22.550Z",
                updatedAt: "2025-11-19T19:45:22.550Z",
                deletedAt: null,
            },
        },
        description: "Solicitud de viaje"
    })
    journeyRequest: JourneyRequest;

    @ApiProperty({
        example: {
            id: "123e4567-e89b-12d3-a456-426614174000",
            brand: "Toyota",
            model: "Corolla",
            year: 2022,
            capacity: 5,
            type: VehicleType.CAR,
            color: "#000000",
            plate: "ABC123"
        },
        description: "Vehículo"
    })
    vehicle: Vehicle

    @ApiProperty({
        example: {
            id: "847d784a-40b1-4ae2-8106-5ed6e97e55a0",
            name: "Franco",
            lastname: "Perez",
            email: "franco@gmail.com",
            password: "$2b$10$dGUHUBgLjr1zoW0lKutdtOAFC5wsJVkD8RDN3Q6HNM80mUZkrlfwK",
            birthdate: "2000-02-29",
            createdAt: "2025-12-02T19:10:29.907Z",
            updatedAt: "2025-12-02T19:10:29.907Z",
            deletedAt: null,
            role: "member"
        },
        description: "Conductor"
    })
    driver: User;

    @ApiProperty({
        example: ProposalStatus.SENT,
        description: "Estado actual de la propuesta"
    })
    status: ProposalStatus;
}