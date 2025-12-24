import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class SendMessageDto {
    @ApiProperty({
        example: "713c3f3b-f708-4751-ac91-72d86c714c2f",
        description: "Receiver ID"
    })
    @IsUUID()
    receiverId: string;

    @ApiProperty({
        example: "06f82bc5-658e-45c0-8f56-1a1870491c58",
        description: "Journey ID"
    })
    @IsUUID()
    journeyId: string;

    @ApiProperty({
        example: "Hola, estoy en camino",
        description: "Message content"
    })
    @IsString()
    @MinLength(1)
    @MaxLength(255)
    content: string;
}