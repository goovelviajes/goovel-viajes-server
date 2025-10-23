import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Length, Matches, Max, Min } from 'class-validator';
import { IsPlate } from '../decorators/is-plate.decorator';
import { VehicleType } from '../enums/vehicle-type.enum';
import { Transform } from 'class-transformer';

export class UpdateVehicleDto {
    @ApiProperty({ example: 'Fiat', description: 'Marca del vehículo' })
    @IsString()
    @IsNotEmpty()
    @Length(2, 50)
    @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'La marca solo puede contener letras y espacios' })
    @Transform(({ value }) => value?.trim())
    @IsOptional()
    brand?: string;

    @ApiProperty({ example: 'Spazio', description: 'Modelo del vehículo' })
    @IsString()
    @IsNotEmpty()
    @Length(1, 50)
    @Matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-]+$/, {
        message: 'El modelo solo puede contener letras, números, espacios o guiones'
    })
    @Transform(({ value }) => value?.trim())
    @IsOptional()
    model?: string;

    @ApiPropertyOptional({ example: '3', description: 'Asientos disponibles totales' })
    @IsInt()
    @Min(1)
    @Max(15)
    @IsPositive()
    @IsOptional()
    capacity?: number;

    @ApiProperty({
        example: '#ffffff',
        description: 'Color del vehículo en formato HEX (#RRGGBB) o RGB (rgb(r, g, b))'
    })
    @IsString()
    @IsNotEmpty()
    @Matches(
        /^(#([0-9a-fA-F]{6})|rgb\(\s*(?:[0-9]|[1-9][0-9]|1\d{2}|2[0-4]\d|25[0-5])\s*,\s*(?:[0-9]|[1-9][0-9]|1\d{2}|2[0-4]\d|25[0-5])\s*,\s*(?:[0-9]|[1-9][0-9]|1\d{2}|2[0-4]\d|25[0-5])\s*\))$/,
        { message: 'El color debe estar en formato HEX (#RRGGBB) o RGB (rgb(r, g, b))' }
    )
    @IsOptional()
    color?: string;

    @ApiProperty({
        example: VehicleType.CAR,
        description: 'Tipo de vehículo',
        enum: VehicleType
    })
    @IsEnum(VehicleType, { message: 'El tipo de vehículo debe ser uno de los valores permitidos' })
    @IsNotEmpty()
    @Transform(({ value }) => value?.toLowerCase())
    @IsOptional()
    type?: VehicleType;

    @ApiProperty({ example: 'Formatos permitidos: ABC123, 123ABC, AB123CD o A000AAA', description: 'Patente del vehiculo' })
    @IsNotEmpty()
    @IsPlate()
    @IsOptional()
    plate?: string;

    @ApiPropertyOptional({ example: '1980', description: 'Año de fabricación' })
    @IsInt()
    @Min(1900)
    @Max(new Date().getFullYear())
    @IsOptional()
    year?: number;
}