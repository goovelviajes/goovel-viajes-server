import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBody, ApiConflictResponse, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiOkResponse, ApiOperation, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleGuard } from '../auth/guard/role.guard';
import { ActiveUser } from '../common/decorator/active-user.decorator';
import { SkipTerms } from '../common/decorator/skip-terms.decorator';
import { ActiveUserInterface } from '../common/interface/active-user.interface';
import { CreateTermDto } from './dtos/create-term.dto';
import { TermsOkResponseDto } from './dtos/terms-ok-response.dto';
import { TermsService } from './terms.service';

@Controller('terms')
export class TermsController {
  constructor(private readonly termsService: TermsService) { }

  @Post('admin/create')
  @SkipTerms()
  @UseGuards(RoleGuard)
  @Roles('admin')
  @ApiOperation({ description: 'Crear una nueva version de los terminos y condiciones' })
  @ApiBody({ type: CreateTermDto, description: 'Version y contenido de los terminos y condiciones' })
  @ApiCreatedResponse({ description: 'Version de los terminos y condiciones creada exitosamente' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized request' })
  @ApiInternalServerErrorResponse({ description: 'Error creating version' })
  @ApiConflictResponse({ description: 'Version already exists' })
  async createNewVersion(@Body() body: CreateTermDto) {
    return this.termsService.createNewVersion(body.content, body.version);
  }

  @Get('latest')
  @SkipTerms()
  @ApiOperation({ description: 'Obtener la version mas reciente de los terminos y condiciones' })
  @ApiOkResponse({ description: 'Version de los terminos y condiciones obtenida exitosamente', type: TermsOkResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized request' })
  @ApiInternalServerErrorResponse({ description: 'Error getting version' })
  async getLatest() {
    return this.termsService.getLatestVersion();
  }

  @Post('accept')
  @SkipTerms()
  @ApiOperation({ description: 'Aceptar los terminos y condiciones' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized request' })
  @ApiInternalServerErrorResponse({ description: 'Error accepting terms' })
  async accept(@ActiveUser() { id }: ActiveUserInterface) {
    return this.termsService.acceptTerms(id);
  }
}
