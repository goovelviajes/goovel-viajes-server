import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ActiveUser } from 'src/common/decorator/active-user.decorator';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenGuard } from './guard/token.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @ApiOperation({ summary: 'Registro de un nuevo usuario' })
  @ApiCreatedResponse({ description: 'Registration Successful' })
  @ApiBadRequestResponse({ description: 'Invalid birthdate format or email is already existent or password is neccesary for local registration' })
  @ApiInternalServerErrorResponse({ description: 'Error user register or creating user' })
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: 'Login de un usuario existente' })
  @ApiCreatedResponse({
    description: 'Successful login',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials or secret key not found', })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({
    description: 'Error user login or getting unique user profile name',
  })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(TokenGuard)
  @ApiOperation({ summary: 'Obtener usuario activo (obtenido desde el token)' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized request' })
  @ApiBearerAuth('access-token')
  @Get()
  getActiveUser(@ActiveUser() user: ActiveUserInterface) {
    return user;
  }

  @ApiOperation({ summary: 'Cambio de contraseña' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized request' })
  @ApiCreatedResponse({ description: 'Password changed successfully' })
  @ApiInternalServerErrorResponse({ description: 'Error changing password' })
  @ApiBearerAuth('access-token')
  @UseGuards(TokenGuard)
  @Post('change-password')
  changePassword(@ActiveUser() { id }: ActiveUserInterface, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(id, dto);
  }

  @ApiOperation({ summary: 'Olvidaste la contraseña?' })
  @ApiCreatedResponse({ description: 'Reset password email sent successfully' })
  @ApiBadRequestResponse({ description: 'Invalid email' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Error sending reset password email' })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Reestablecimiento de contraseña' })
  @ApiCreatedResponse({ description: 'Password reset successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid reset token or password do not match' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Error resetting password' })
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
