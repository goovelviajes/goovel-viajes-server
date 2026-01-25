import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
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
    private readonly logger = new Logger(ReportService.name);

    constructor(
        @InjectRepository(Report)
        private readonly reportRepository: Repository<Report>,
        private readonly userService: UserService,
        private readonly mailService: MailService
    ) { }

    async createReport(reporterId: string, createReportDto: CreateReportDto) {
        try {
            const { reportedId, reason, description } = createReportDto;

            if (reporterId === reportedId) {
                throw new BadRequestException('You cannot report yourself');
            }

            const reportedUser = await this.userService.getUserById(reportedId);
            if (!reportedUser) {
                throw new NotFoundException('Reported user not found');
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
                this.logger.warn(`[REPORT_DUPLICATE] - Reporter: ${reporterId} already has a pending report for: ${reportedId}`);
                throw new BadRequestException('User already has a pending report for this user');
            }

            const report = this.reportRepository.create({
                reporter: { id: reporterId },
                reported: reportedUser,
                reason,
                description,
            });

            const savedReport = await this.reportRepository.save(report);

            this.logger.log(`[REPORT_CREATED] - ID: ${savedReport.id} - From: ${reporterId} To: ${reportedId}`);

            // Verificar si el usuario ha superado el umbral de reportes para informar al administrador
            try {
                await this.checkUserReportThreshold(reportedUser);
            } catch (error) {
                this.logger.error(`[REPORT_THRESHOLD_ERROR] - Failed to check threshold for: ${reportedId}`, error.stack);
            }

            return {
                ...savedReport,
                reporter: { id: reporterId },
                reported: { id: reportedId },
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[CREATE_REPORT_ERROR] - From: ${reporterId} to: ${createReportDto.reportedId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error processing report");
        }
    }

    private async checkUserReportThreshold(reportedUser: User) {
        try {
            const count = await this.reportRepository.count({
                where: {
                    reported: { id: reportedUser.id },
                    status: Not(ReportStatus.DISMISSED)
                }
            });

            if (count >= 3) {
                this.logger.warn(`[REPORT_THRESHOLD_REACHED] - User: ${reportedUser.id} has ${count} active reports. Sending alert email.`);
                await this.mailService.sendReportThresholdEmail(reportedUser, count);
            }
        } catch (error) {
            this.logger.error(
                `[CHECK_THRESHOLD_ERROR] - User: ${reportedUser.id} - Error: ${error.message}`,
                error.stack
            );
        }
    }

    async findAllReports(status: ReportStatus) {
        try {
            const reports = await this.reportRepository.find({
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

            this.logger.log(`[REPORTS_FETCH_SUCCESS] - Status: ${status} - Count: ${reports.length}`);

            return reports;
        } catch (error) {
            this.logger.error(
                `[REPORTS_FETCH_ERROR] - Status: ${status} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error retrieving reports list");
        }
    }

    async updateStatus(id: string, updateDto: UpdateReportDto) {
        try {
            // 1. Buscamos el reporte con las relaciones necesarias
            const report = await this.reportRepository.findOne({
                where: { id },
                relations: ['reporter', 'reported']
            });

            if (!report) {
                this.logger.warn(`[REPORT_STATUS_NOT_FOUND] - ID: ${id}`);
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
            this.logger.log(`[REPORT_STATUS_UPDATED] - ID: ${id} - New Status: ${updateDto.status}`);

            // 4. Lógica secundaria: Notificar al reportero y bloquear al reportado si es necesario
            if (updateDto.status === ReportStatus.RESOLVED) {

                // Si tiene el flag de banImmediately, se banea al usuario de manera inmediata
                if (updateDto.banImmediately) {
                    await this.userService.banUser(
                        report.reported.id,
                        `Banned by admin`
                    );
                    this.logger.error(`[USER_BANNED_IMMEDIATELY] - User: ${report.reported.id} - Due to Report: ${id}`);
                } else {
                    const resolvedCount = await this.reportRepository.count({
                        where: {
                            reported: { id: report.reported.id },
                            status: ReportStatus.RESOLVED
                        }
                    });

                    if (resolvedCount >= 5) {
                        await this.userService.banUser(report.reported.id, 'Banned for multiple reports');
                        this.logger.error(`[USER_BANNED_THRESHOLD] - User: ${report.reported.id} reached ${resolvedCount} resolved reports`);
                    }
                }

                try {
                    await this.mailService.sendReportResolvedEmail(
                        report.reporter.email,
                        report.reporter.name,
                        report.reporter.lastname,
                    );
                } catch (error) {
                    this.logger.error(`[MAIL_RESOLUTION_ERROR] - ID: ${id} - Error: ${error.message}`);
                }
            }

            return {
                message: 'Report updated successfully',
                id: report.id,
                status: report.status,
                adminNotes: report.adminNotes
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[UPDATE_REPORT_STATUS_ERROR] - ID: ${id} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error updating report status");
        }
    }
}
