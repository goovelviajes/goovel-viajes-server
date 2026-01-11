import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateReportDto } from './dtos/create-report.dto';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { User } from '../user/entities/user.entity';
import { ReportStatus } from './enums/report-status.enum';

@Injectable()
export class ReportService {
    constructor(
        @InjectRepository(Report)
        private readonly reportRepository: Repository<Report>,
        private readonly userService: UserService,
        private readonly mailService: MailService
    ) { }

    async createReport(reporterId: string, createReportDto: CreateReportDto) {
        const { reportedId, reason, description } = createReportDto;

        if (reporterId === reportedId) {
            throw new BadRequestException('You cannot report yourself');
        }

        const reportedUser = await this.userService.getUserById(reportedId);

        if (!reportedUser) {
            throw new NotFoundException('User not found');
        }

        // Verificar si el usuario ya tiene un reporte pendiente
        const alreadyHasPending = await this.reportRepository.findOne({
            where: {
                reporter: { id: reporterId },
                reported: { id: reportedId },
                status: ReportStatus.PENDING
            }
        });

        if (alreadyHasPending) {
            throw new BadRequestException('User already has a pending report for this user');
        }

        const report = this.reportRepository.create({
            reporter: { id: reporterId },
            reported: reportedUser,
            reason,
            description,
        });

        const savedReport = await this.reportRepository.save(report);

        // Verificar si el usuario ha superado el umbral de reportes para informar al administrador
        await this.checkUserReportThreshold(reportedUser);

        return {
            ...savedReport,
            reporter: {
                id: reporterId,
            },
            reported: {
                id: reportedId,
            },
        };
    }

    private async checkUserReportThreshold(reportedUser: User) {
        const count = await this.reportRepository.count({
            where: {
                reported: { id: reportedUser.id },
                status: Not(ReportStatus.DISMISSED)
            }
        });

        if (count >= 3) {
            await this.mailService.sendReportThresholdEmail(reportedUser, count);
        }
    }
}
