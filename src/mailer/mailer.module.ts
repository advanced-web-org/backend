// mailer.module.ts
import { Module } from '@nestjs/common';
import { AppMailerService } from './mailer.service';
import { MailerModule as NestMailerModule } from '@nestjs-modules/mailer';
import * as path from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppMailerController } from './mailer.controller';

@Module({
  imports: [
    NestMailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        console.log('EMAIL_USERNAME:', configService.get<string>('EMAIL_USERNAME'));
        console.log('EMAIL_FROM:', configService.get<string>('EMAIL_FROM'));
        console.log('Resolved Template Path:', path.join(__dirname, 'templates'));
        return {
          transport: {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true, // TLS
            auth: {
              user: configService.get<string>('EMAIL_USERNAME'),
              pass: configService.get<string>('EMAIL_PASSWORD'),
            },
          },
          defaults: {
            from: `"No Reply" <${configService.get<string>('EMAIL_FROM')}>`,
          },
          template: {
            dir: path.join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },

    }),
  ],
  controllers: [AppMailerController],
  providers: [AppMailerService],
  exports: [AppMailerService],
})
export class AppMailerModule { }
