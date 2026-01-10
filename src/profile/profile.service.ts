import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { generateRandomProfilename } from '../profile/lib/generate-username';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { FileUploadService } from '../upload/file-upload.service';
import { UserService } from '../user/user.service';
import { RatingService } from '../rating/rating.service';
import { JourneyService } from '../journey/journey.service';

@Injectable()
export class ProfileService {
    constructor(
        @InjectRepository(Profile) private readonly profileRepository: Repository<Profile>,
        private readonly fileUploadService: FileUploadService,
        private readonly userService: UserService,
        private readonly ratingService: RatingService,
        private readonly journeyService: JourneyService
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
        if (updateProfileDto.profileName) {
            await this.verifyProfileNameExists(updateProfileDto.profileName);

            const normalizedProfileName = updateProfileDto.profileName.toLowerCase().replace(/\s/g, "");
            updateProfileDto.profileName = normalizedProfileName;
        }

        const profile = await this.profileRepository.findOne({ where: { user: { id: userId } } });
        if (!profile) throw new NotFoundException("Profile not found");

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

    private async verifyProfileNameExists(profileName: string) {
        const profile = await this.profileRepository.findOne({ where: { profileName } });
        if (profile) {
            throw new BadRequestException("Profile name already exists");
        }
    }

    async getProfile(profileName: string) {
        const profile = await this.profileRepository.findOne({
            where: { profileName },
            select: ['id', 'profileName', 'image', 'address', 'city', 'country', 'province']
        });

        if (!profile) {
            throw new NotFoundException("Profile not found");
        }

        const user = await this.userService.getUserByProfileName(profileName);
        profile.user = user;

        const averageRating = await this.ratingService.getAverageRating(user.id);
        const countCompletedByDriver = await this.journeyService.countCompletedByDriver(user.id);
        const countCompletedByPassenger = await this.journeyService.countCompletedByPassenger(user.id);

        return {
            ...profile,
            stats: {
                averageRating,
                countCompletedByDriver,
                countCompletedByPassenger
            }
        };
    }
}
