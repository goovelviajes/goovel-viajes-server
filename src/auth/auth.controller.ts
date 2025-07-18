import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ActiveUser } from 'src/common/decorator/active-user.decorator';
import { ActiveUserInterface } from 'src/common/interface/active-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenGuard } from './guard/token.guard';

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
    description: 'Error user login',
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

  @Post('google')
  loginWithGoogle(@Body() body: { idToken: string }) {
    return this.authService.loginWithGoogle(body.idToken)
  }
}
