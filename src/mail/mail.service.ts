import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class MailService {
    constructor(private readonly mailerService: MailerService) { }

    // MÉTODO DE APOYO: Esto garantiza que Mailtrap no reciba 
    // correos más rápido de lo que permite su plan gratuito.
    private async sleep() {
        if (process.env.NODE_ENV === 'development') {
            return new Promise(resolve => setTimeout(resolve, 10000));
        }
    }

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
            await this.sleep();
        } catch (error) {
            console.error('Error al enviar el correo de recuperación:', error);
            throw new InternalServerErrorException('Error while sending reset password email');
        }
    }

    async sendConfirmationMail(email: string, confirmationToken: string): Promise<void> {
        const confirmUrl = `${process.env.FRONTEND_URL}/confirm-email?token=${confirmationToken}`;

        try {
            await this.mailerService.sendMail({
                to: email,
                subject: 'Confirmación de correo | Goovel Viajes',
                template: './confirm-email',
                context: {
                    url: confirmUrl,
                    year: new Date().getFullYear(),
                },
            });
            await this.sleep();
        } catch (error) {
            console.error('Error al enviar el correo de confirmación:', error);
            throw new InternalServerErrorException('Error while sending confirmation email');
        }
    }

    async sendReportThresholdEmail(user: User, count: number): Promise<void> {
        try {
            const goovelEmail = process.env.GOOVEL_MAIL;

            await this.mailerService.sendMail({
                to: goovelEmail,
                subject: '⚠️ Alerta: Usuario con múltiples reportes',
                template: './report-threshold',
                context: {
                    year: new Date().getFullYear(),
                    reportedName: user.name,
                    reportedLastName: user.lastname,
                    reportedEmail: user.email,
                    count,
                    adminUrl: process.env.FRONTEND_URL + '/admin/reports',
                },
            });
            await this.sleep();
        } catch (error) {
            console.error('Error al enviar el correo de reporte:', error);
            throw new InternalServerErrorException('Error while sending report threshold email');
        }
    }

    async sendReportResolvedEmail(reporterEmail: string, reporterName: string, reporterLastName: string) {
        try {
            await this.mailerService.sendMail({
                to: reporterEmail,
                subject: 'Actualización sobre el reporte enviado - Goovel',
                template: './report-resolved',
                context: {
                    reporterName: reporterName,
                    reporterLastName: reporterLastName,
                    url: process.env.FRONTEND_URL,
                    year: new Date().getFullYear(),
                },
            });
            await this.sleep();
        } catch (error) {
            console.error('Error al enviar el email de resolución:', error);
        }
    }

    async sendUserBannedEmail(email: string, name: string, lastname: string, reason: string) {
        try {
            await this.mailerService.sendMail({
                to: email,
                subject: '🚫 Aviso Importante: Tu cuenta de Goovel ha sido suspendida',
                template: './user-banned',
                context: {
                    year: new Date().getFullYear(),
                    name,
                    lastname,
                    reason,
                },
            });
            await this.sleep();
        } catch (error) {
            console.error('Error al enviar el correo de confirmación:', error);
        }
    }
}