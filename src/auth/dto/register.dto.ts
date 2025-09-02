import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
// import { AuthProvider } from '../enums/auth-provider.enum';

export class RegisterDto {
  @ApiProperty({ example: 'Adrian', description: 'Nombre del nuevo usuario' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Calo', description: 'Apellido del nuevo usuario' })
  @IsString()
  @IsNotEmpty()
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
