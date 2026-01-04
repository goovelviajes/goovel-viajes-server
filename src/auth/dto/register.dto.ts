import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { IsAdult } from '../../common/decorator/is-adult.decorator';
import { IsValidBirthdate } from '../../common/decorator/is-valid-birthdate.decorator';

export class RegisterDto {
  @ApiProperty({ example: 'Adrian', description: 'Nombre del nuevo usuario' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/, { message: 'name must contain only letters and spaces' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Calo', description: 'Apellido del nuevo usuario' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]+$/, { message: 'name must contain only letters and spaces' })
  @IsString()
  @IsNotEmpty()
  lastname: string;

  @ApiProperty({ example: 'adrian@example.com', description: 'Email que sera utilizado para la autenticacion' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Pass1234', description: 'Nueva contraseña' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d|.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y un carácter especial'
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(12)
  password: string;

  @ApiProperty({
    example: "1995-01-24",
    description: "Fecha de nacimiento en formato YYYY-MM-DD",
    format: "date"
  })
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  @IsDateString({}, { message: 'La fecha de nacimiento debe tener un formato válido (YYYY-MM-DD)' })
  @IsValidBirthdate()
  @IsAdult()
  birthdate: string;
}
