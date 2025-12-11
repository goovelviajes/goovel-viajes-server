import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateRatingDto {
    @ApiProperty({
        example: 5,
        description: "Puntuacion dada al viaje realizado",
        required: true,
        type: Number,
        minimum: 1,
        maximum: 5
    })
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({
        example: "Great journey!",
        description: "Comentario sobre el viaje realizado",
        required: false,
        type: String,
        minLength: 1,
        maxLength: 255
    })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    @MinLength(1)
    @MaxLength(255)
    comment?: string;

    @ApiProperty({
        example: "123e4567-e89b-12d3-a456-426614174000",
        description: "ID del viaje realizado",
        required: true,
        type: String
    })
    @IsUUID()
    journeyId: string;

    @ApiProperty({
        example: "123e4567-e89b-12d3-a456-426614174000",
        description: "ID del usuario que se le dio la puntuacion",
        required: false,
        type: String
    })
    @IsUUID()
    @IsOptional()
    ratedId?: string;
}
