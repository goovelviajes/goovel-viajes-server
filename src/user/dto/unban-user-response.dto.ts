import { ApiProperty } from "@nestjs/swagger";

export class UnbanUserResponseDto {
    @ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Id del usuario "unbanned"'
    })
    id: string;

    @ApiProperty({
        example: 'false',
        description: 'El estado del ban del usuario'
    })
    isBanned: boolean;

    @ApiProperty({
        example: '2026-01-19T15:35:13.123Z',
        description: 'La fecha en que se le dio el ban al usuario'
    })
    bannedAt: Date;

    @ApiProperty({
        example: 'Al usuario se le dio ban por spam',
        description: 'La razón por la cual se le dio el ban al usuario'
    })
    banReason: string;

    @ApiProperty({
        example: 'User unbanned successfully',
        description: 'Mensaje de "unban" exitoso'
    })
    message: string;
}