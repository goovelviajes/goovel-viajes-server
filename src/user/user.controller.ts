import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiInternalServerErrorResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { TokenGuard } from '../auth/guard/token.guard';
import { ActiveUser } from '../common/decorator/active-user.decorator';
import { ActiveUserInterface } from '../common/interface/active-user.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { GrantVerificationDto } from './dto/grant-verification.dto';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UnbanUserResponseDto } from './dto/unban-user-response.dto';

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
    return this.userService.grantVerification(email, true);
  }

  @UseGuards(TokenGuard, RoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Quitar verificación de profesional a un usuario' })
  @ApiNoContentResponse()
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Error revoking verification' })
  @ApiBearerAuth('access-token')
  @Patch('revoke-verification')
  @HttpCode(204)
  revokeVerification(@Body() { email }: GrantVerificationDto) {
    return this.userService.grantVerification(email, false);
  }

  @Patch('unban/:userId')
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Quitar ban a un usuario' })
  @ApiOkResponse({ description: 'User unbanned', type: UnbanUserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Error unbanning user' })
  @ApiBearerAuth('access-token')
  unbanUser(@Param('userId', ParseUUIDPipe) id: string) {
    return this.userService.unbanUser(id);
  }
}
