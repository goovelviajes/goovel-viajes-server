import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { generateRandomProfilename } from 'src/profile/lib/generate-username';

@Injectable()
export class ProfileService {
    constructor(@InjectRepository(Profile) private readonly profileRepository: Repository<Profile>) { }

    async getUniqueProfileName(name: string) {
        try {
            let profileName: string;
            let exists = true;

            while (exists) {
                profileName = generateRandomProfilename(name);
                const profile = await this.profileRepository.findOne({ where: { profileName } });
                exists = !!profile;
            }

            return profileName;
        } catch (error) {
            throw new InternalServerErrorException("Error getting unique user profile name")
        }
    }
}
