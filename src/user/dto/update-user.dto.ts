import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";
import { IsAdult } from "src/common/decorator/is-adult.decorator";

export class UpdateUserDto {
    @ApiPropertyOptional({
        example: "Juan",
        description: "Nombre actualizado"
    })
    @IsOptional()
    @IsString()
    name: string;

    @ApiPropertyOptional({
        example: "Peralta",
        description: "Apellido actualizado"
    })
    @IsOptional()
    @IsString()
    lastname?: string;

    @ApiPropertyOptional({
        example: "1995-01-24",
        description: "Fecha de nacimiento en formato YYYY-MM-DD",
        format: "date"
    })
    @IsOptional()
    @IsDateString({}, { message: 'La fecha de nacimiento debe tener un formato válido (YYYY-MM-DD)' })
    @IsAdult()
    birthdate?: string;

    @ApiPropertyOptional({
        example: "2281443322",
        description: "Numero de telefono actualizado"
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiPropertyOptional({
        example: "13222333",
        description: "DNI actualizado"
    })
    @IsOptional()
    @IsString()
    dni?: string;

    @ApiPropertyOptional({
        example: "Av. Dorrego 132",
        description: "Direccion actualizada"
    })
    @IsOptional()
    @IsString()
    address?: string;
}