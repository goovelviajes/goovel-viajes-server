import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateReportDto } from './dtos/create-report.dto';
import { UserService } from '../user/user.service';
import { MailService } from '../mail/mail.service';
import { User } from '../user/entities/user.entity';
import { ReportStatus } from './enums/report-status.enum';
import { UpdateReportDto } from './dtos/update-report.dto';

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
        try {
            await this.checkUserReportThreshold(reportedUser);
        } catch (error) {
            console.error('Error checking user report threshold:', error);
        }

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

    async findAllReports(status: ReportStatus) {
        return this.reportRepository.find({
            where: {
                status
            },
            relations: ['reporter', 'reported', 'reporter.profile', 'reported.profile'],
            select: {
                reporter: {
                    id: true,
                    name: true,
                    lastname: true,
                    email: true,
                    profile: {
                        id: true,
                        image: true
                    }
                },
                reported: {
                    id: true,
                    name: true,
                    lastname: true,
                    email: true,
                    profile: {
                        id: true,
                        image: true
                    }
                }
            },
            order: {
                createdAt: 'DESC'
            }
        });
    }

    async updateStatus(id: string, updateDto: UpdateReportDto) {
        // 1. Buscamos el reporte con las relaciones necesarias
        const report = await this.reportRepository.findOne({
            where: { id },
            relations: ['reporter', 'reported']
        });

        if (!report) {
            throw new NotFoundException(`Report with ID ${id} not found`);
        }

        // 2. Bloqueamos cambios si ya estaba resuelto (opcional, por integridad)
        if (report.status !== ReportStatus.PENDING && report.status === updateDto.status) {
            throw new BadRequestException('Report already has this status');
        }

        // 3. Aplicamos los cambios
        report.status = updateDto.status;
        report.adminNotes = updateDto.adminNotes;

        await this.reportRepository.save(report);

        // 4. Lógica secundaria: Notificar al reportero y bloquear al reportado si es necesario
        if (updateDto.status === ReportStatus.RESOLVED) {
            const resolvedCount = await this.reportRepository.count({
                where: {
                    reported: { id: report.reported.id },
                    status: ReportStatus.RESOLVED
                }
            });

            if (resolvedCount >= 5) {
                await this.userService.banUser(report.reported.id, 'Banned for multiple reports');
            }

            try {
                await this.mailService.sendReportResolvedEmail(
                    report.reporter.email,
                    report.reporter.name,
                    report.reporter.lastname,
                );
            } catch (error) {
                console.error('Error sending resolution email:', error);
            }
        }

        return {
            message: 'Report updated successfully',
            id: report.id,
            status: report.status,
            adminNotes: report.adminNotes
        };
    }
}
