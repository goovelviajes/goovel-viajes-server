import { Body, Controller, Get, Param, ParseEnumPipe, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { TokenGuard } from '../auth/guard/token.guard';
import { ActiveUser } from '../common/decorator/active-user.decorator';
import { ActiveUserInterface } from '../common/interface/active-user.interface';
import { CreateReportResponseDto } from './dtos/create-report-response.dto';
import { CreateReportDto } from './dtos/create-report.dto';
import { ReportOkResponseDto } from './dtos/report-ok-response.dto';
import { UpdateReportDto } from './dtos/update-report.dto';
import { UpdatedReportResponseDto } from './dtos/updated-report-response.dto';
import { ReportStatus } from './enums/report-status.enum';
import { ReportService } from './report.service';

@ApiTags('Report')
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) { }

  @ApiOperation({ summary: 'Reportar un usuario' })
  @ApiCreatedResponse({ description: 'Report created successfully', type: CreateReportResponseDto })
  @ApiBody({ type: CreateReportDto })
  @ApiBadRequestResponse({ description: 'Cannot self report, report already exists' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Error reporting user' })
  @ApiBearerAuth('access-token')
  @UseGuards(TokenGuard)
  @Post()
  async createReport(
    @ActiveUser() { id: reporterId }: ActiveUserInterface,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportService.createReport(reporterId, dto);
  }

  @ApiOperation({ summary: 'Obtener todos los reportes filtrados por su estado' })
  @ApiOkResponse({ description: 'Reports fetched successfully', type: [ReportOkResponseDto] })
  @ApiInternalServerErrorResponse({ description: 'Error fetching reports' })
  @ApiBearerAuth('access-token')
  @UseGuards(TokenGuard, RoleGuard)
  @Roles(RolesEnum.ADMIN)
  @Get()
  async findAllReports(@Query('status', new ParseEnumPipe(ReportStatus)) status: ReportStatus) {
    return this.reportService.findAllReports(status);
  }

  @UseGuards(TokenGuard, RoleGuard)
  @Roles(RolesEnum.ADMIN)
  @ApiOperation({ summary: 'Actualizar el estado de un reporte' })
  @ApiOkResponse({ description: 'Report updated successfully', type: UpdatedReportResponseDto })
  @ApiNotFoundResponse({ description: 'Report not found' })
  @ApiInternalServerErrorResponse({ description: 'Error updating report' })
  @ApiBearerAuth('access-token')
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) reportId: string,
    @Body() updateDto: UpdateReportDto
  ) {
    return await this.reportService.updateStatus(reportId, updateDto);
  }
}
