import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Asegúrate de tener esto
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule], // Importante para acceder al .env
            useFactory: async (config: ConfigService) => ({
                transport: {
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false,
                    auth: {
                        // Usamos el ConfigService para obtener las variables de forma segura
                        user: config.get<string>('USER_NAME_MAIL'),
                        pass: config.get<string>('USER_PASSWORD_MAIL'),
                    },
                },
                defaults: {
                    from: `"Goovel Viajes" <${config.get('USER_NAME_MAIL')}>`,
                },
                template: {
                    dir: join(__dirname, 'templates'),
                    adapter: new HandlebarsAdapter(),
                    options: {
                        strict: true,
                    },
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule { }