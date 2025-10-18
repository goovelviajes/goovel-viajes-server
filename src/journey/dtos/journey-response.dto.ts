import { ApiProperty } from "@nestjs/swagger";
import { JourneyType } from "../enums/journey-type.enum";

class LocationResponseDto {
    @ApiProperty({ example: "Benito Juarez" })
    name: string;

    @ApiProperty({ example: -34.6037 })
    lat: number;

    @ApiProperty({ example: -58.3816 })
    lng: number;
}

class UserResponseDto {
    @ApiProperty({ example: "a2243e00-acd3-4c75-bf9d-ee0b445103cb" })
    id: string;

    @ApiProperty({ example: "Micalela" })
    name: string;

    @ApiProperty({ example: "Aguilar" })
    lastname: string;

    @ApiProperty({ example: "mica@gmail.com" })
    email: string;

    @ApiProperty({ example: "2000-07-15" })
    birthdate: string;

    @ApiProperty({ example: "2025-09-22T17:20:45.964Z" })
    createdAt: string;

    @ApiProperty({ example: "2025-09-22T17:20:45.964Z" })
    updatedAt: string;

    @ApiProperty({ example: null, nullable: true })
    deletedAt: string | null;

    @ApiProperty({ example: "member" })
    role: string;
}

class VehicleUserResponseDto {
    @ApiProperty({ example: "a2243e00-acd3-4c75-bf9d-ee0b445103cb" })
    id: string;
}

class VehicleResponseDto {
    @ApiProperty({ example: "eb079dcb-fa64-4d19-a73b-667e2c91ac82" })
    id: string;

    @ApiProperty({ example: "Fiat" })
    brand: string;

    @ApiProperty({ example: "Spazio" })
    model: string;

    @ApiProperty({ example: 3 })
    capacity: number;

    @ApiProperty({ example: "#ffffff" })
    color: string;

    @ApiProperty({ example: "AB123CD" })
    plate: string;

    @ApiProperty({ example: "car" })
    type: string;

    @ApiProperty({ example: 1980 })
    year: number;

    @ApiProperty({ type: VehicleUserResponseDto })
    user: VehicleUserResponseDto;
}

export class JourneyResponseDto {
    @ApiProperty({ type: LocationResponseDto })
    origin: LocationResponseDto;

    @ApiProperty({ type: LocationResponseDto })
    destination: LocationResponseDto;

    @ApiProperty({ example: "2025-11-22T08:00:00.000Z" })
    departureTime: string;

    @ApiProperty({ example: 5, nullable: true })
    availableSeats: number | null;

    @ApiProperty({ example: 5000, nullable: true })
    pricePerSeat: number | null;

    @ApiProperty({ enum: JourneyType, example: JourneyType.CARPOOL })
    type: JourneyType;

    @ApiProperty({ type: UserResponseDto })
    user: UserResponseDto;

    @ApiProperty({ type: VehicleResponseDto })
    vehicle: VehicleResponseDto;

    @ApiProperty({ example: "296386a0-d563-4ff6-a8ad-2e1491ac947c" })
    id: string;

    @ApiProperty({ example: "2025-09-27T00:23:18.674Z" })
    createdAt: string;

    @ApiProperty({ example: "pending" })
    status: string;
}
