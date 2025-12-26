import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'John Doe', description: 'Nombre del perfil' })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    profileName?: string;

    @ApiPropertyOptional({ example: '123456789', description: 'Telefono del perfil' })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    phone?: string;

    @ApiPropertyOptional({ example: '123 Main St', description: 'Direccion del perfil' })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    address?: string;

    @ApiPropertyOptional({ example: 'New York', description: 'Ciudad del perfil' })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    city?: string;

    @ApiPropertyOptional({ example: 'United States', description: 'Pais del perfil' })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    country?: string;

    @ApiPropertyOptional({ example: 'New York', description: 'Provincia del perfil' })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    province?: string;
}