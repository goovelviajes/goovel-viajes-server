import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { IsPlate } from '../decorators/is-plate.decorator';
import { VehicleType } from '../enums/vehicle-type.enum';

export class UpdateVehicleDto {
    @ApiPropertyOptional({ example: 'Fiat', description: 'Marca del vehiculo' })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    brand: string;

    @ApiPropertyOptional({ example: 'Spazio', description: 'Modelo del vehiculo' })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    model: string;

    @ApiPropertyOptional({ example: '3', description: 'Asientos disponibles totales' })
    @IsInt()
    @Min(1)
    @Max(10)
    @IsOptional()
    capacity: number;

    @ApiPropertyOptional({ example: '#ffffff', description: 'Color del vehiculo' })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    color: string;

    @ApiPropertyOptional({ example: 'car', description: 'Tipo de vehiculo' })
    @IsEnum(VehicleType)
    @IsNotEmpty()
    @IsOptional()
    type: VehicleType;

    @ApiPropertyOptional({ example: 'ABC123 o AB123CD', description: 'Patente del vehiculo' })
    @IsNotEmpty()
    @IsPlate()
    @IsOptional()
    plate: string;

    @ApiPropertyOptional({ example: '1980', description: 'Año de fabricación' })
    @IsInt()
    @Min(1900)
    @Max(new Date().getFullYear())
    @IsOptional()
    year: number;
}