import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class UpdateUserDto {
    @ApiPropertyOptional({
        example: "Juan",
        description: "Nombre actualizado"
    })
    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres' })
    @Matches(/^[a-zA-ZÀ-ÿ\s]+$/, { message: 'El nombre solo puede contener letras y espacios' })
    name: string;

    @ApiPropertyOptional({
        example: "Peralta",
        description: "Apellido actualizado"
    })
    @IsOptional()
    @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
    @MaxLength(50, { message: 'El apellido no puede superar los 50 caracteres' })
    @Matches(/^[a-zA-ZÀ-ÿ\s]+$/, { message: 'El apellido solo puede contener letras y espacios' })
    lastname?: string;

    @ApiPropertyOptional({
        example: "1995-01-24",
        description: "Fecha de nacimiento en formato YYYY-MM-DD",
        format: "date"
    })
    @IsOptional()
    @IsString()
    birthdate?: Date;

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