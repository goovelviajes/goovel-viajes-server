import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsObject, IsPositive, IsString, ValidateIf, ValidateNested } from "class-validator";
import { JourneyType } from "../enums/journey-type.enum";
import { LocationDto } from "./location.dto";

export class CreateJourneyDto {
    @ApiProperty({ type: LocationDto })
    @IsObject()
    @ValidateNested()
    @Type(() => LocationDto)
    origin: LocationDto;

    @ApiProperty({ type: LocationDto })
    @IsObject()
    @ValidateNested()
    @Type(() => LocationDto)
    destination: LocationDto;

    @ApiProperty({ example: '2025-10-01T08:00:00Z', description: 'Fecha y hora de salida en formato ISO' })
    @Type(() => Date)
    @IsNotEmpty()
    departureTime: Date;

    @ApiPropertyOptional({ example: 3, description: 'Cantidad de asientos disponibles' })
    @ValidateIf(o => o.type === JourneyType.CARPOOL)
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    @IsNotEmpty({ message: 'availableSeats is required for carpool journeys' })
    availableSeats: number;

    @ApiPropertyOptional({ example: 2500.5, description: 'Precio por asiento. Opcional si es un viaje de tipo PACKAGE' })
    @ValidateIf(o => o.type === JourneyType.CARPOOL)
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    @IsNotEmpty({ message: 'pricePerSeat is required for carpool journeys' })
    pricePerSeat: number;

    @ApiProperty({ enum: JourneyType, description: 'Tipo de viaje (CARPOOL o PACKAGE)' })
    @IsEnum(JourneyType)
    type: JourneyType;

    @ApiProperty({ example: 'uuid-del-vehiculo', description: 'ID del vehículo asociado al viaje' })
    @IsString()
    @IsNotEmpty()
    vehicleId: string;
}