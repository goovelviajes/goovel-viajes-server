import { ApiProperty } from "@nestjs/swagger";
import { Journey } from "src/journey/entities/journey.entity";
import { User } from "src/user/entities/user.entity";

export class RatingCreatedResponseDto {
    @ApiProperty({
        example: "c4e21b0c-c072-4b31-9289-40ce0803311b",
        description: "Rating ID"
    })
    id: string;

    @ApiProperty({
        example: 5,
        description: "Rating"
    })
    rating: number;

    @ApiProperty({
        example: "Great journey!",
        description: "Comentario"
    })
    comment: string;

    @ApiProperty({
        example: {
            "id": "847d784a-40b1-4ae2-8106-5ed6e97e55a0",
            "name": "Franco",
            "lastname": "Perez",
            "email": "franco@gmail.com",
            "password": "$2b$10$dGUHUBgLjr1zoW0lKutdtOAFC5wsJVkD8RDN3Q6HNM80mUZkrlfwK",
            "birthdate": "2000-02-29",
            "createdAt": "2025-12-02T19:10:29.907Z",
            "updatedAt": "2025-12-02T19:10:29.907Z",
            "deletedAt": null,
            "role": "member"
        },
        description: "Usuario que dio la calificación"
    })
    raterUser: User;

    @ApiProperty({
        example: {
            "id": "337f211e-6c41-429f-a74c-0b5d666fbf72",
            "name": "Fernando",
            "lastname": "Corpore",
            "email": "fernando@gmail.com",
            "password": "$2b$10$NB8oKtk9At6tMozqWcogUeYwGexE/a9S1sh.NjRxfYasoLZo2gJWm",
            "birthdate": "2000-02-29",
            "createdAt": "2025-12-06T21:34:22.668Z",
            "updatedAt": "2025-12-06T21:34:22.668Z",
            "deletedAt": null,
            "role": "member"
        },
        description: "Usuario que recibió la calificación"
    })
    ratedUser: User;

    @ApiProperty({
        example: {
            "id": "06f82bc5-658e-45c0-8f56-1a1870491c58",
            "origin": {
                "lat": -34.6037,
                "lng": -58.3816,
                "name": "Benito Juarez"
            },
            "destination": {
                "lat": -34.6037,
                "lng": -59.3816,
                "name": "Tandil"
            },
            "departureTime": "2028-11-24T08:02:00.000Z",
            "availableSeats": 5,
            "pricePerSeat": "0.00",
            "createdAt": "2025-12-08T18:39:58.030Z",
            "type": "carpool",
            "status": "completed",
            "user": {
                "id": "847d784a-40b1-4ae2-8106-5ed6e97e55a0",
                "name": "Franco",
                "lastname": "Perez",
                "email": "franco@gmail.com",
                "password": "$2b$10$dGUHUBgLjr1zoW0lKutdtOAFC5wsJVkD8RDN3Q6HNM80mUZkrlfwK",
                "birthdate": "2000-02-29",
                "createdAt": "2025-12-02T19:10:29.907Z",
                "updatedAt": "2025-12-02T19:10:29.907Z",
                "deletedAt": null,
                "role": "member"
            },
            "vehicle": {
                "id": "d2f594ce-5b34-4eec-af04-ac01691a77be",
                "brand": "Fiat",
                "model": "Toro",
                "capacity": 3,
                "color": "#ffffff",
                "plate": "ABC124",
                "type": "car",
                "year": 1980
            }
        },
        description: "ID de la ruta"
    })
    journey: Journey;

    @ApiProperty({
        example: "2025-12-09T00:12:28.282Z",
        description: "Fecha de creación"
    })
    createdAt: Date;
}