import { ApiProperty } from "@nestjs/swagger";

class User {
    @ApiProperty({ description: 'Id del usuario' })
    id: string;
    @ApiProperty({ description: 'Nombre del usuario' })
    name: string;
    @ApiProperty({ description: 'Apellido del usuario' })
    lastname: string;
    @ApiProperty({
        type: Object,
        example: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            image: 'https://example.com/image.jpg'
        }
    })
    profile: { id: string, image: string };
}

export class MessageOkResponseDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Id del mensaje' })
    id: string;
    @ApiProperty({ example: 'Hello', description: 'Contenido del mensaje' })
    content: string;
    @ApiProperty({ example: false, description: 'Indica si el mensaje ha sido leído' })
    isRead: boolean;
    @ApiProperty({ example: '2025-12-24T15:18:05.123Z', description: 'Fecha de creación del mensaje' })
    createdAt: Date;
    @ApiProperty({
        type: User,
        example: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'John',
            lastname: 'Doe',
            profile: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                image: 'https://example.com/image.jpg'
            }
        }
    })
    sender: User;
    @ApiProperty({
        type: User,
        example: {
            id: '987e4567-e89b-12d3-a456-426614174321',
            name: 'Mary',
            lastname: 'Jane',
            profile: {
                id: '987e4567-e89b-12d3-a456-426614174321',
                image: 'https://example.com/image.jpg'
            }
        }
    })
    receiver: User;
}