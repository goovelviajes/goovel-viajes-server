import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: "youremail@example.com", description: "Email del usuario" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "pass1234", description: "Contraseña del usuario" })
  @IsString()
  @IsNotEmpty()
  password: string;
}
