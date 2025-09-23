import { ApiProperty } from "@nestjs/swagger";
import { VehicleType } from "../enums/vehicle-type.enum";

export class VehicleResponseDto {
    @ApiProperty({ example: 'Fiat' })
    brand: string;

    @ApiProperty({ example: 'Spazio' })
    model: string;

    @ApiProperty({ example: '3' })
    capacity: number;

    @ApiProperty({ example: '#ffffff' })
    color: string;

    @ApiProperty({ example: 'car' })
    type: VehicleType;

    @ApiProperty({ example: 'ABC123' })
    plate: string;

    @ApiProperty({ example: '1980' })
    year: number;

    @ApiProperty({ example: { id: 'e342f8e2-523b-43b4-bf5c-fee3725d6ac7' } })
    user: { id: string }

    @ApiProperty({ example: '534f3a72-dc32-4cb5-988f-9725300b9a9d' })
    id: string;
}