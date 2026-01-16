import { IsNotEmpty, IsString } from "class-validator";

export class CreateTermDto {
    @IsString()
    @IsNotEmpty()
    content: string;

    @IsString()
    @IsNotEmpty()
    version: string;
}