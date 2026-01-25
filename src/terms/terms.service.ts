import { ConflictException, HttpException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TermsVersion } from './entities/terms-version.entity';
import { TermsAcceptance } from './entities/terms-acceptance.entity';

@Injectable()
export class TermsService {
    private readonly logger = new Logger(TermsService.name);

    constructor(
        @InjectRepository(TermsVersion) private termsRepository: Repository<TermsVersion>,
        @InjectRepository(TermsAcceptance) private acceptanceRepository: Repository<TermsAcceptance>,
    ) { }

    async createNewVersion(content: string, version: string) {
        try {
            await this.verifyIfVersionExists(version);

            // Marcar todas las versiones anteriores como isActive: false
            await this.termsRepository.update({ isActive: true }, { isActive: false });

            const newTerms = await this.termsRepository.save({
                content,
                versionNumber: version,
                isActive: true
            });

            this.logger.log(`[TERMS_NEW_VERSION] - Version: ${version} is now the active version.`);

            return newTerms;
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[TERMS_CREATE_ERROR] - Version: ${version} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error creating new terms and conditions version");
        }

    }

    private async verifyIfVersionExists(version: string) {
        try {
            const versionExists = await this.termsRepository.findOne({ where: { versionNumber: version } });

            if (versionExists) {
                this.logger.warn(`[TERMS_VERSION_CONFLICT] - Attempted to create duplicate version: ${version}`);
                throw new ConflictException('Version already exists');
            }
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[TERMS_VERSION_CHECK_ERROR] - Version: ${version} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error validating terms version");
        }

    }

    async getLatestVersion() {
        try {
            const latestTerms = await this.termsRepository.findOne({
                where: { isActive: true },
                order: { createdAt: 'DESC' }
            });

            if (!latestTerms) {
                this.logger.warn('[TERMS_NOT_FOUND] - No active terms found in database');
            }

            return latestTerms;

        } catch (error) {
            this.logger.error(
                `[TERMS_FETCH_ERROR] - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error retrieving latest terms and conditions");
        }
    }

    async acceptTerms(userId: string) {
        try {
            const latestVersion = await this.getLatestVersion();

            if (!latestVersion) {
                this.logger.error('[TERMS_ACCEPT_ERROR] - No active terms version found to accept');
                throw new InternalServerErrorException("No active terms version available");
            }

            await this.verifyIfUserHasAcceptedVersion(userId, latestVersion.id);

            const acceptance = this.acceptanceRepository.create({
                userId,
                versionId: latestVersion.id,
                acceptedAt: new Date(),
            });

            const savedAcceptance = await this.acceptanceRepository.save(acceptance);

            this.logger.log(`[TERMS_ACCEPTED] - User: ${userId} accepted Version: ${latestVersion.versionNumber}`);

            return savedAcceptance;
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[TERMS_ACCEPT_ERROR] - User: ${userId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error recording terms acceptance");
        }

    }

    private async verifyIfUserHasAcceptedVersion(userId: string, versionId: string) {
        try {
            const acceptance = await this.acceptanceRepository.findOne({ where: { userId, versionId } });

            if (acceptance) {
                this.logger.debug?.(`[TERMS_ALREADY_ACCEPTED] - User: ${userId} already accepted VersionID: ${versionId}`);
                throw new ConflictException('User has already accepted this version');
            }
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[VERIFY_ACCEPTANCE_ERROR] - User: ${userId} - Version: ${versionId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error verifying terms acceptance status");
        }

    }

    async hasAcceptedLatest(userId: string): Promise<boolean> {
        try {
            const latest = await this.getLatestVersion();

            if (!latest) {
                this.logger.warn(`[CHECK_ACCEPTANCE_FAILED] - No active terms found in DB`);
                return false;
            }

            const acceptance = await this.acceptanceRepository.findOne({
                where: { userId, versionId: latest.id }
            });

            const hasAccepted = !!acceptance;

            this.logger.debug?.(
                `[TERMS_CHECK] - User: ${userId} - Version: ${latest.versionNumber} - Accepted: ${hasAccepted}`
            );

            return hasAccepted;
        } catch (error) {
            this.logger.error(
                `[HAS_ACCEPTED_LATEST_ERROR] - User: ${userId} - Error: ${error.message}`,
                error.stack
            );
            // Ante la duda en un error técnico, devolvemos false para proteger la legalidad
            return false;
        }
    }
}