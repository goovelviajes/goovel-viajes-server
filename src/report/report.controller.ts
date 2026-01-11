import { Body, Controller, Get, ParseEnumPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from '../auth/guard/token.guard';
import { ActiveUser } from '../common/decorator/active-user.decorator';
import { ActiveUserInterface } from '../common/interface/active-user.interface';
import { CreateReportResponseDto } from './dtos/create-report-response.dto';
import { CreateReportDto } from './dtos/create-report.dto';
import { ReportService } from './report.service';
import { RoleGuard } from 'src/auth/guard/role.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesEnum } from 'src/common/enums/roles.enum';
import { ReportStatus } from './enums/report-status.enum';
import { ReportOkResponseDto } from './dtos/report-ok-response.dto';

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
}
