import { ApiProperty } from "@nestjs/swagger";
import { VehicleType } from "../enums/vehicle-type.enum";

export class VehicleResponseDto {
    @ApiProperty({ example: '534f3a72-dc32-4cb5-988f-9725300b9a9d' })
    id: string;

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
}