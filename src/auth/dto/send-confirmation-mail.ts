import { IsEmail } from "class-validator";

export class SendConfirmationMailDto {
    @IsEmail()
    email: string;
}