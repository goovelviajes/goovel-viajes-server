import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString, Max, MaxLength, Min } from "class-validator";

export class LocationDto {
    @ApiProperty({ example: 'Buenos Aires', description: 'Nombre de la ubicación' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name: string;

    @ApiProperty({ example: -34.6037, description: 'Latitud de la ubicación', maximum: 90, minimum: -90 })
    @IsNumber({ maxDecimalPlaces: 8 })
    @Min(-90)
    @Max(90)
    lat: number;

    @ApiProperty({ example: -58.3816, description: 'Longitud de la ubicación', maximum: 180, minimum: -180 })
    @IsNumber({ maxDecimalPlaces: 8 })
    @Min(-180)
    @Max(180)
    lng: number;
}   