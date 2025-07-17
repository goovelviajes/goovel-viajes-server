import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
    @ApiProperty({ example: 'b5a58a1d-0b79-4a61-8e33-5ca9fdc2904e' })
    id: string;

    @ApiProperty({ example: 'Jose' })
    name: string;

    @ApiProperty({ example: 'Cardenas' })
    lastname: string;

    @ApiProperty({ example: 'tomas@example.com' })
    email: string;

    @ApiProperty({ example: '1133445566', nullable: true })
    phone: string | null;

    @ApiProperty({ example: '1996-01-01', format: 'date' })
    birthdate: string;

    @ApiProperty({ example: '2025-07-03T15:50:45.384Z', format: 'date-time' })
    createdAt: string;

    @ApiProperty({ example: '2025-07-05T04:38:40.000Z', format: 'date-time' })
    updatedAt: string;

    @ApiProperty({ example: null, nullable: true, format: 'date-time' })
    deletedAt: string | null;

    @ApiProperty({ example: false })
    isAdmin: boolean;

    @ApiProperty({ example: '39433649' })
    dni: string;

    @ApiProperty({ example: 'Av. Siempreviva 742', nullable: true })
    address: string | null;
}
