import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
// import { AuthProvider } from '../enums/auth-provider.enum';

export class RegisterDto {
  @ApiProperty({
    example: 'Adrián',
    description: 'Nombre del nuevo usuario'
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ\s]+$/, { message: 'El nombre solo puede contener letras y espacios' })
  name: string;

  @ApiProperty({
    example: 'Calo',
    description: 'Apellido del nuevo usuario'
  })
  @IsString()
  @IsNotEmpty({ message: 'El apellido no puede estar vacío' })
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El apellido no puede superar los 50 caracteres' })
  @Matches(/^[a-zA-ZÀ-ÿ\s]+$/, { message: 'El apellido solo puede contener letras y espacios' })
  lastname: string;

  @ApiProperty({ example: 'adrian@example.com', description: 'Email que sera utilizado para la autenticacion' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'pass1234', description: 'Nueva contraseña' })
  @IsNotEmpty()
  password: string;

  @ApiProperty({ example: '2025-05-22', description: 'Fecha de nacimiento del usuario' })
  @IsNotEmpty()
  @IsString()
  birthdate: Date;

  // @ApiProperty({ example: 'local', enum: AuthProvider })
  // @IsString()
  // @IsOptional()
  // provider: AuthProvider;
}
