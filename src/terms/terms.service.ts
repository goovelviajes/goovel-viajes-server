import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TermsVersion } from './entities/terms-version.entity';
import { TermsAcceptance } from './entities/terms-acceptance.entity';

@Injectable()
export class TermsService {
    constructor(
        @InjectRepository(TermsVersion) private termsRepository: Repository<TermsVersion>,
        @InjectRepository(TermsAcceptance) private acceptanceRepository: Repository<TermsAcceptance>,
    ) { }

    async createNewVersion(content: string, version: string) {
        await this.verifyIfVersionExists(version);

        // Marcar todas las versiones anteriores como isActive: false
        await this.termsRepository.update({ isActive: true }, { isActive: false });

        return this.termsRepository.save({
            content,
            versionNumber: version,
            isActive: true
        });
    }

    private async verifyIfVersionExists(version: string) {
        const versionExists = await this.termsRepository.findOne({ where: { versionNumber: version } });
        if (versionExists) {
            throw new ConflictException('Version already exists');
        }
    }

    async getLatestVersion() {
        return this.termsRepository.findOne({ where: { isActive: true }, order: { createdAt: 'DESC' } });
    }

    async acceptTerms(userId: string) {
        const latestVersion = await this.getLatestVersion();

        await this.verifyIfUserHasAcceptedVersion(userId, latestVersion.id);

        const acceptance = this.acceptanceRepository.create({
            userId,
            versionId: latestVersion.id,
            acceptedAt: new Date(),
        });
        return this.acceptanceRepository.save(acceptance);
    }

    private async verifyIfUserHasAcceptedVersion(userId: string, versionId: string) {
        const acceptance = await this.acceptanceRepository.findOne({ where: { userId, versionId } });
        if (acceptance) {
            throw new ConflictException('User has already accepted this version');
        }
    }

    async hasAcceptedLatest(userId: string): Promise<boolean> {
        const latest = await this.getLatestVersion();

        if (!latest) {
            return false;
        }

        const acceptance = await this.acceptanceRepository.findOne({
            where: { userId, versionId: latest.id }
        });
        return !!acceptance;
    }
}