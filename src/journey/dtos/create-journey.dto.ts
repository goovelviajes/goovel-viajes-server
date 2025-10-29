import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsNotEmptyObject, IsNumber, IsObject, IsPositive, IsString, IsUUID, ValidateIf, ValidateNested } from "class-validator";
import { JourneyType } from "../enums/journey-type.enum";
import { LocationDto } from "./location.dto";
import { IsDifferentLocation } from "src/common/decorator/is-diferent-location.decorator";
import { IsFutureDate } from "src/common/decorator/is-future-date.decorator";

export class CreateJourneyDto {
    @ApiProperty({ type: LocationDto })
    @IsObject()
    @ValidateNested()
    @Type(() => LocationDto)
    @IsNotEmptyObject()
    origin: LocationDto;

    @ApiProperty({ type: LocationDto })
    @IsObject()
    @ValidateNested()
    @Type(() => LocationDto)
    @IsNotEmptyObject()
    @IsDifferentLocation({ message: 'Destination must be different from origin' })
    destination: LocationDto;

    @ApiProperty({ example: '2025-10-01T08:00:00Z', description: 'Fecha y hora de salida en formato ISO' })
    @Type(() => Date)
    @IsNotEmpty()
    @IsFutureDate({ message: 'departureTime must be in the future' })
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
    @IsUUID()
    vehicleId: string;
}