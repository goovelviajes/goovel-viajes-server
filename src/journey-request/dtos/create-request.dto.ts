import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsNumber,
    IsObject,
    IsOptional,
    IsPositive,
    IsString,
    Matches,
    Max,
    Min,
    Validate,
    ValidateIf,
    ValidateNested
} from 'class-validator';
import { IsFutureDate } from 'src/common/decorator/is-future-date.decorator';
import { LocationDto } from 'src/common/dtos/location.dto';
import { JourneyType } from 'src/journey/enums/journey-type.enum';

export class CreateRequestDto {
    @ApiProperty({ type: LocationDto })
    @IsObject()
    @ValidateNested()
    @Type(() => LocationDto)
    origin: LocationDto;

    @ApiProperty({ type: LocationDto })
    @IsObject()
    @ValidateNested()
    @Type(() => LocationDto)
    @Validate((o: CreateRequestDto) =>
        JSON.stringify(o.origin) !== JSON.stringify(o.destination),
        { message: 'Origin and destination cannot be equal' }
    )
    destination: LocationDto;

    @ApiProperty({ example: '2025-09-30T00:00:00', description: 'Fecha y horario de partida' })
    @Type(() => Date)
    @IsFutureDate({ message: 'requestedTime must be in the future' })
    requestedTime: Date;

    @ApiPropertyOptional({ example: '5000', description: 'Precio propuesto por el solicitante (puede ser null)' })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    @Min(100, { message: 'Minimum allowed price is 100' })
    @Max(100000, { message: 'Maximum allowed price is 100000' })
    proposedPrice?: number;

    @ApiProperty({ example: JourneyType.CARPOOL, description: 'Tipo de viaje solicitado (CARPOOL o PACKAGE)' })
    @IsEnum(JourneyType)
    type: JourneyType;

    @ApiProperty({ example: '4', description: 'Asientos requeridos (en caso que el tipo de solicitud sea CARPOOL)' })
    @ValidateIf((o) => o.type === 'carpool')
    @IsInt()
    @Min(1)
    @Max(15)
    requestedSeats?: number;
    @ApiProperty({ example: '5', description: 'Peso del paquete en kilogramos (solo si el tipo es PACKAGE)' })
    @ValidateIf(o => o.type === 'package')
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El peso debe ser un número con hasta 2 decimales' })
    @IsPositive({ message: 'El peso debe ser mayor a 0' })
    @Max(150, { message: 'El peso no puede superar los 150 kg' })
    packageWeight?: number;

    @ApiProperty({ example: '50', description: 'Longitud del paquete en centímetros (solo si el tipo es PACKAGE)' })
    @ValidateIf(o => o.type === 'package')
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La longitud debe ser un número con hasta 2 decimales' })
    @IsPositive({ message: 'La longitud debe ser mayor a 0' })
    @Max(1000, { message: 'La longitud no puede superar los 1000 cm (10 m)' })
    packageLength?: number;

    @ApiProperty({ example: '40', description: 'Ancho del paquete en centímetros (solo si el tipo es PACKAGE)' })
    @ValidateIf(o => o.type === 'package')
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El ancho debe ser un número con hasta 2 decimales' })
    @IsPositive({ message: 'El ancho debe ser mayor a 0' })
    @Max(200, { message: 'El ancho no puede superar los 200 cm (2 m)' })
    packageWidth?: number;

    @ApiProperty({ example: '30', description: 'Alto del paquete en centímetros (solo si el tipo es PACKAGE)' })
    @ValidateIf(o => o.type === 'package')
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'La altura debe ser un número con hasta 2 decimales' })
    @IsPositive({ message: 'La altura debe ser mayor a 0' })
    @Max(200, { message: 'La altura no puede superar los 200 cm (2 m)' })
    packageHeight?: number;

    @ApiPropertyOptional({ example: 'Paquete con contenido muy frágil', description: 'Descripción extra del paquete (solo si el tipo es PACKAGE)' })
    @ValidateIf(o => o.type === 'package')
    @IsOptional()
    @IsString({ message: 'La descripción debe ser texto' })
    @Matches(/^[a-zA-ZÀ-ÿ0-9\s.,;:()'"!¿?_-]{0,255}$/, {
        message: 'La descripción contiene caracteres inválidos o supera los 255 caracteres',
    })
    packageDescription?: string;
}
