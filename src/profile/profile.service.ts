import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { generateRandomProfilename } from '../profile/lib/generate-username';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { FileUploadService } from 'src/upload/file-upload.service';

@Injectable()
export class ProfileService {
    constructor(
        @InjectRepository(Profile) private readonly profileRepository: Repository<Profile>,
        private readonly fileUploadService: FileUploadService
    ) { }

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

    async updateProfileData(userId: string, updateProfileDto: UpdateProfileDto, file?: Express.Multer.File) {
        const profileDtoLength = Object.keys(updateProfileDto).length;

        if (profileDtoLength === 0 && !file) {
            throw new BadRequestException("No data to update");
        }

        const profile = await this.profileRepository.findOne({ where: { user: { id: userId } } });

        if (!profile) {
            throw new NotFoundException("Profile not found");
        }

        if (file) {
            const customName = `profile_${userId}_${Date.now()}`;
            const targetFolder = 'goovel/profile';

            const result = await this.fileUploadService.uploadFile(
                file.buffer,
                targetFolder,
                {
                    public_id: customName,
                }
            );

            profile.image = result.secure_url;
        }


        Object.assign(profile, updateProfileDto);
        return await this.profileRepository.save(profile);
    }
}
