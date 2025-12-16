import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
    constructor(private readonly mailerService: MailerService) { }

    async sendResetPasswordMail(email: string, resetToken: string): Promise<void> {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Restablecer contraseña | Goovel Viajes',
                template: './reset-password',
                context: {
                    url: resetUrl,
                    year: new Date().getFullYear(),
                },
            });
        } catch (error) {
            console.error('Error al enviar el correo de recuperación:', error);
            throw new InternalServerErrorException('No se pudo enviar el correo de recuperación');
        }
    }
}