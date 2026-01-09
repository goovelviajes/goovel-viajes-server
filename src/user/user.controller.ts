import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Patch,
  UseGuards
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiInternalServerErrorResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { TokenGuard } from '../auth/guard/token.guard';
import { ActiveUser } from '../common/decorator/active-user.decorator';
import { ActiveUserInterface } from '../common/interface/active-user.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { GrantVerificationDto } from './dto/grant-verification.dto';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @UseGuards(TokenGuard)
  @ApiOperation({ summary: 'Actualizar datos especificos del usuario' })
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ description: "Invalid date format" })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Error updating user information' })
  @ApiBearerAuth('access-token')
  @Patch()
  @HttpCode(204)
  updateUserInformation(@ActiveUser() { id }: ActiveUserInterface, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUserInformation(id, updateUserDto)
  }

  @UseGuards(TokenGuard)
  @ApiOperation({ summary: 'Eliminar usuario activo (obtenido via token)' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Error soft deleting user' })
  @ApiBearerAuth('access-token')
  @Delete('me')
  @HttpCode(204)
  softDeleteUser(@ActiveUser() { id }: ActiveUserInterface) {
    return this.userService.softDeleteUser(id);
  }

  @UseGuards(TokenGuard, RoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Dar verificación de profesional a un usuario' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Error granting verification' })
  @ApiBearerAuth('access-token')
  @Patch('grant-verification')
  @HttpCode(204)
  grantVerification(@Body() { email }: GrantVerificationDto) {
    return this.userService.grantVerification(email);
  }
}
