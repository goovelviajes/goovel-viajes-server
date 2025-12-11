import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateProfileDto {
    @ApiPropertyOptional({ example: 'John Doe', description: 'Nombre del perfil' })
    @IsString()
    @IsOptional()
    profileName?: string;

    @ApiPropertyOptional({ example: '123456789', description: 'Telefono del perfil' })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiPropertyOptional({ example: 'https://example.com/image.jpg', description: 'Imagen del perfil' })
    @IsString()
    @IsOptional()
    image?: string;

    @ApiPropertyOptional({ example: '123 Main St', description: 'Direccion del perfil' })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional({ example: 'New York', description: 'Ciudad del perfil' })
    @IsString()
    @IsOptional()
    city?: string;

    @ApiPropertyOptional({ example: 'United States', description: 'Pais del perfil' })
    @IsString()
    @IsOptional()
    country?: string;

    @ApiPropertyOptional({ example: 'New York', description: 'Provincia del perfil' })
    @IsString()
    @IsOptional()
    province?: string;
}