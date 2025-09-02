import { IsInt, Min, Max, IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { VehicleType } from '../enums/vehicle-type.enum';

export class CreateVehicleDto {
    @IsString()
    @IsNotEmpty()
    brand: string;

    @IsString()
    @IsNotEmpty()
    model: string;

    @IsInt()
    @Min(1)
    @Max(10)
    capacity: number;

    @IsString()
    @IsNotEmpty()
    color: string;

    @IsEnum(VehicleType)
    @IsNotEmpty()
    type: VehicleType;

    @IsInt()
    @Min(1900)
    @Max(new Date().getFullYear())
    year: number;
}