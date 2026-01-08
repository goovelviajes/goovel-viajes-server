import { BadRequestException, Body, Controller, Get, HttpCode, Param, Patch, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { TokenGuard } from 'src/auth/guard/token.guard';
import { ActiveUser } from 'src/common/decorator/active-user.decorator';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBadRequestResponse, ApiBody, ApiConsumes, ApiInternalServerErrorResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ProfileOkResponseDto, ProfileWithUserResponseDto } from './dtos/profile-ok-response.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  @ApiOperation({ summary: 'Actualizar datos del perfil' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos del perfil',
    type: UpdateProfileDto,
  })
  @ApiNotFoundResponse({ description: 'Perfil no encontrado' })
  @ApiOkResponse({ description: 'Perfil actualizado correctamente', type: ProfileOkResponseDto })
  @ApiUnauthorizedResponse({ description: 'Usuario no autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno del servidor' })
  @UseGuards(TokenGuard)
  @Patch()
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter(req, file, callback) {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return callback(new BadRequestException('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
  }))
  async updateProfileData(
    @ActiveUser() { id: userId }: ActiveUserInterface,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    return await this.profileService.updateProfileData(userId, updateProfileDto, file);
  }

  @ApiOperation({ summary: 'Obtener datos del perfil' })
  @ApiOkResponse({ description: 'Perfil obtenido correctamente', type: ProfileWithUserResponseDto })
  @ApiNotFoundResponse({ description: 'Perfil o usuario no encontrados' })
  @ApiUnauthorizedResponse({ description: 'Usuario no autorizado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno del servidor' })
  @Get(':profileName')
  getProfile(@Param('profileName') profileName: string) {
    return this.profileService.getProfile(profileName);
  }
}
