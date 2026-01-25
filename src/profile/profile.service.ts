import { BadRequestException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
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
    private readonly logger = new Logger(ProfileService.name);

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

                if (exists) {
                    this.logger.debug?.(`[PROFILE_NAME_COLLISION] - Name ${profileName} already taken, retrying...`);
                }
            }

            this.logger.log(`[PROFILE_NAME_GENERATED] - Unique name found: ${profileName}`);

            return profileName;
        } catch (error) {
            this.logger.error(
                `[GET_UNIQUE_PROFILE_NAME_ERROR] - Input Name: ${name} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error getting unique user profile name");
        }
    }

    async updateProfileData(userId: string, updateProfileDto: UpdateProfileDto, file?: Express.Multer.File) {
        try {
            if (updateProfileDto.profileName) {
                await this.verifyProfileNameExists(updateProfileDto.profileName);

                const normalizedProfileName = updateProfileDto.profileName.toLowerCase().replace(/\s/g, "");
                updateProfileDto.profileName = normalizedProfileName;
            }

            const profile = await this.profileRepository.findOne({ where: { user: { id: userId } } });
            if (!profile) {
                this.logger.warn(`[PROFILE_UPDATE_NOT_FOUND] - User: ${userId}`);
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
                this.logger.log(`[PROFILE_IMAGE_UPLOADED] - User: ${userId} - URL: ${result.secure_url}`);
            }

            Object.assign(profile, updateProfileDto);
            const updatedProfile = await this.profileRepository.save(profile);

            this.logger.log(`[PROFILE_UPDATED_SUCCESS] - User: ${userId}`);

            return updatedProfile;
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[PROFILE_UPDATE_ERROR] - User: ${userId} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error updating profile data");
        }

    }

    private async verifyProfileNameExists(profileName: string) {
        try {
            const profile = await this.profileRepository.findOne({ where: { profileName } });

            if (profile) {
                this.logger.warn(`[PROFILE_NAME_TAKEN] - Attempt to use existing name: ${profileName}`);
                throw new BadRequestException("Profile name already exists");
            }
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[VERIFY_PROFILE_NAME_ERROR] - Name: ${profileName} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error validating profile name availability");
        }

    }

    async getProfile(profileName: string) {
        try {
            const profile = await this.profileRepository.findOne({
                where: { profileName },
                select: ['id', 'profileName', 'image', 'address', 'city', 'country', 'province']
            });

            if (!profile) {
                this.logger.warn(`[GET_PROFILE_NOT_FOUND] - ProfileName: ${profileName}`);
                throw new NotFoundException("Profile not found");
            }

            const user = await this.userService.getUserByProfileName(profileName);
            profile.user = user;

            const averageRating = await this.ratingService.getAverageRating(user.id);
            const countCompletedByDriver = await this.journeyService.countCompletedByDriver(user.id);
            const countCompletedByPassenger = await this.journeyService.countCompletedByPassenger(user.id);

            this.logger.log(`[GET_PROFILE_SUCCESS] - Profile: ${profileName} - Rating: ${averageRating}`);

            return {
                ...profile,
                stats: {
                    averageRating,
                    countCompletedByDriver,
                    countCompletedByPassenger
                }
            };
        } catch (error) {
            if (error instanceof HttpException) throw error;

            this.logger.error(
                `[GET_PROFILE_ERROR] - ProfileName: ${profileName} - Error: ${error.message}`,
                error.stack
            );
            throw new InternalServerErrorException("Error retrieving public profile");
        }
    }
}
