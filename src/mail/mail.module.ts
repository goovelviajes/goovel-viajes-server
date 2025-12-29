import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
    imports: [
        MailerModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (config: ConfigService) => ({
                transport: {
                    host: config.get<string>('MAIL_HOST'),
                    port: config.get<number>('MAIL_PORT'),
                    secure: false,
                    auth: {
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