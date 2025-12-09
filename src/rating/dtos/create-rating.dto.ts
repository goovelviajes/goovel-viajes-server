import { IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateRatingDto {
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @IsString()
    @MinLength(1)
    @MaxLength(255)
    comment: string;

    @IsUUID()
    journeyId: string;

    @IsUUID()
    @IsOptional()
    ratedId?: string;
}
