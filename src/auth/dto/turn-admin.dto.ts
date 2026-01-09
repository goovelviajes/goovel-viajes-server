import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";

export class TurnAdminDto {
    @ApiProperty({
        example: 'example@example.com',
        description: 'Email del usuario',
        required: true,
    })
    @IsEmail()
    email: string;
}