import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);

    constructor(private readonly mailerService: MailerService) { }

    // MÉTODO DE APOYO: Esto garantiza que Mailtrap no reciba 
    // correos más rápido de lo que permite su plan gratuito.
    private async sleep() {
        if (process.env.NODE_ENV === 'development') {
            this.logger.debug('Sleeping for 10s to respect Mailtrap rate limits...');
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
            this.logger.log(`[MAIL_SENT] Password Reset -> To: ${email}`);
            await this.sleep();
        } catch (error) {
            this.logger.error(`[MAIL_ERROR] Password Reset -> To: ${email} - Error: ${error.message}`);
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
            this.logger.log(`[MAIL_SENT] Email Confirmation -> To: ${email}`);
            await this.sleep();
        } catch (error) {
            this.logger.error(`[MAIL_ERROR] Email Confirmation -> To: ${email} - Error: ${error.message}`);
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
            this.logger.warn(`[MAIL_SENT] Admin Alert (Threshold) -> Reported User: ${user.id}`);
            await this.sleep();
        } catch (error) {
            this.logger.error(`[MAIL_ERROR] Admin Alert (Threshold) -> Error: ${error.message}`);
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
            this.logger.log(`[MAIL_SENT] Report Resolved -> To: ${reporterEmail}`);
            await this.sleep();
        } catch (error) {
            this.logger.error(`[MAIL_ERROR] Report Resolved -> To: ${reporterEmail} - Error: ${error.message}`);
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
            this.logger.log(`[MAIL_SENT] User Banned Notification -> To: ${email}`);
            await this.sleep();
        } catch (error) {
            this.logger.error(`[MAIL_ERROR] User Banned Notification -> To: ${email} - Error: ${error.message}`);
        }
    }
}