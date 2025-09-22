import { IsInt, Min, Max, IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { VehicleType } from '../enums/vehicle-type.enum';
import { IsPlate } from '../decorators/is-plate.decorator';
import { ApiOperation, ApiProperty } from '@nestjs/swagger';

export class CreateVehicleDto {
    @ApiProperty({ example: 'Fiat', description: 'Marca del vehiculo' })
    @IsString()
    @IsNotEmpty()
    brand: string;

    @ApiProperty({ example: 'Spazio', description: 'Modelo del vehiculo' })
    @IsString()
    @IsNotEmpty()
    model: string;

    @ApiProperty({ example: '3', description: 'Asientos disponibles totales' })
    @IsInt()
    @Min(1)
    @Max(10)
    capacity: number;

    @ApiProperty({ example: '#ffffff', description: 'Color del vehiculo' })
    @IsString()
    @IsNotEmpty()
    color: string;

    @ApiProperty({ example: 'car', description: 'Tipo de vehiculo' })
    @IsEnum(VehicleType)
    @IsNotEmpty()
    type: VehicleType;

    @ApiProperty({ example: 'ABC123 o AB123CD', description: 'Patente del vehiculo' })
    @IsNotEmpty()
    @IsPlate()
    plate: string;

    @ApiProperty({ example: '1980', description: 'Año de fabricación' })
    @IsInt()
    @Min(1900)
    @Max(new Date().getFullYear())
    year: number;
}