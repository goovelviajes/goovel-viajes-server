import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsDateString,
    IsEnum,
    IsInt,
    IsNumber,
    IsObject,
    IsOptional,
    IsPositive,
    IsString,
    Max,
    Min,
    ValidateIf,
    ValidateNested
} from 'class-validator';
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
    destination: LocationDto;

    @ApiProperty({ example: '2025-09-30T00:00:00', description: 'Fecha y horario de partida' })
    @IsDateString()
    requestedTime: Date;

    @ApiPropertyOptional({ example: '5000', description: 'Precio propuesto por el solicitante (puede ser null)' })
    @IsOptional()
    @IsNumber()
    @IsPositive()
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

    @ApiProperty({ example: '5', description: 'Peso del paquete en kilogramos (en caso que el tipo de solicitud sea PACKAGE)' })
    @ValidateIf((o) => o.type === 'package')
    @IsNumber()
    packageWeight?: number;

    @ApiProperty({ example: '5', description: 'Longitud del paquete en centimetros (en caso que el tipo de solicitud sea PACKAGE)' })
    @ValidateIf((o) => o.type === 'package')
    @IsNumber()
    packageLength?: number;

    @ApiProperty({ example: '5', description: 'Ancho del paquete en KG (en caso que el tipo de solicitud sea PACKAGE)' })
    @ValidateIf((o) => o.type === 'package')
    @IsNumber()
    packageWidth?: number;

    @ApiProperty({ example: '5', description: 'Alto del paquete en KG (en caso que el tipo de solicitud sea PACKAGE)' })
    @ValidateIf((o) => o.type === 'package')
    @IsNumber()
    packageHeight?: number;

    @ApiPropertyOptional({ example: 'Paquete con contenido muy fragil', description: 'Descripcion extra del paquete a enviar (en caso que el tipo de solicitud sea PACKAGE)' })
    @ValidateIf((o) => o.type === 'package')
    @IsString()
    @IsOptional()
    packageDescription?: string;
}
