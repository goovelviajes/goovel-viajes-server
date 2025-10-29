import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Patch,
  UseGuards
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiInternalServerErrorResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { TokenGuard } from 'src/auth/guard/token.guard';
import { ActiveUser } from 'src/common/decorator/active-user.decorator';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserService } from './user.service';

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


  // Metodo opcional (agregar y arreglar en caso que se quiera restaurar a un usuario eliminado)
  // @UseGuards(TokenGuard)
  // @Patch('/restore')
  // restoreDeletedUser(@ActiveUser() { id }: ActiveUserInterface) {
  //   console.log(id)
  //   return this.userService.restoreDeletedUser(id)
  // }
}
