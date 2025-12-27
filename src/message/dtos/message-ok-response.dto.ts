import { ApiProperty } from '@nestjs/swagger';

class ProfileResponseDto {
    @ApiProperty({ example: 'uuid-perfil' })
    id: string;

    @ApiProperty({ example: 'https://cdn.com/foto.jpg', nullable: true })
    image: string;
}

class UserResponseDto {
    @ApiProperty({ example: 'uuid-usuario' })
    id: string;

    @ApiProperty({ example: 'Juan' })
    name: string;

    @ApiProperty({ example: 'Pérez' })
    lastname: string;

    @ApiProperty({ type: ProfileResponseDto })
    profile: ProfileResponseDto;
}

export class MessageOkResponseDto {
    @ApiProperty({ example: 'uuid-mensaje' })
    id: string;

    @ApiProperty({ example: 'Hola, ¿cómo estás?' })
    content: string;

    @ApiProperty({ example: '2023-10-27T10:00:00Z' })
    createdAt: Date;

    @ApiProperty({ example: false })
    isRead: boolean;

    @ApiProperty({ type: UserResponseDto })
    sender: UserResponseDto;

    @ApiProperty({ type: UserResponseDto })
    receiver: UserResponseDto;
}