import { ApiProperty } from "@nestjs/swagger";
import { Equals, IsDefined, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class ChangePasswordDto {
    @ApiProperty({ example: 'Password1234', description: 'Contraseña actual' })
    @IsDefined()
    @IsNotEmpty()
    oldPassword: string;

    @ApiProperty({ example: 'Pass1234', description: 'Nueva contraseña' })
    @IsDefined()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must have at least 8 characters' })
    @MaxLength(12, { message: 'Password must have less than 12 characters' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d|.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
        })
    newPassword: string;

    @ApiProperty({ example: 'Pass1234', description: 'Confirmar nueva contraseña' })
    @IsDefined({ message: 'Confirmation password is required' })
    @IsNotEmpty({ message: 'Confirmation password cannot be empty' })
    @IsString({ message: 'Confirmation password format is invalid' })
    // @Equals('newPassword', { message: 'La confirmación de la contraseña no coincide con la nueva contraseña.' })
    confirmPassword: string;
}