import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString } from "class-validator";
import { IsAdult } from "src/common/decorator/is-adult.decorator";
import { IsValidBirthdate } from "src/common/decorator/is-valid-birthdate.decorator";

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
    @IsValidBirthdate()
    @IsAdult()
    birthdate?: string;
}