import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class ResetPasswordDto {
    @ApiProperty({ example: 'token123456789', description: 'Token' })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ example: 'Pass1234', description: 'Nueva contraseña' })
    @IsDefined()
    @IsNotEmpty()
    @MinLength(8, { message: 'Password must have at least 8 characters' })
    @MaxLength(12, { message: 'Password must have less than 12 characters' })
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d|.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
        message: 'La contraseña debe contener al menos una letra mayúscula, una letra minúscula, un número y un carácter especial'
    })
    newPassword: string;

    @ApiProperty({ example: 'Pass1234', description: 'Confirmar nueva contraseña' })
    @IsDefined({ message: 'Confirmation password is required' })
    @IsNotEmpty({ message: 'Confirmation password cannot be empty' })
    @IsString({ message: 'Confirmation password format is invalid' })
    confirmPassword: string;
}