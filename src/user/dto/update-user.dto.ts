import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, matches, Matches } from "class-validator";
import { IsAdult } from "src/common/decorator/is-adult.decorator";
import { IsValidBirthdate } from "src/common/decorator/is-valid-birthdate.decorator";

export class UpdateUserDto {
    @ApiPropertyOptional({
        example: "Juan",
        description: "Nombre actualizado"
    })
    @IsOptional()
    @IsString()
    @Matches(/^[\p{L}][\p{L}\s]*[\p{L}]$/u, { message: 'El nombre solo puede contener letras y espacios, y no puede comenzar o terminar con un espacio' })
    name: string;

    @ApiPropertyOptional({
        example: "Peralta",
        description: "Apellido actualizado"
    })
    @IsOptional()
    @IsString()
    @Matches(/^[\p{L}][\p{L}\s]*[\p{L}]$/u, { message: 'El nombre solo puede contener letras y espacios, y no puede comenzar o terminar con un espacio' })
    lastname?: string;

    @ApiPropertyOptional({
        example: "1995-01-24",
        description: "Fecha de nacimiento en formato YYYY-MM-DD",
        format: "date"
    })
    @IsOptional()
    @IsDateString({}, { message: 'La fecha de nacimiento debe tener un formato válido (YYYY-MM-DD)' })
    @IsValidBirthdate()
    @Matches(/^(194[5-9]|19[5-9]\d|20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, {
    message: 'El año debe ser mayor a 1945 y tener formato YYYY-MM-DD'})
    @IsAdult()
    birthdate?: string;
}