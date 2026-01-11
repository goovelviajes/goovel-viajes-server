import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { TokenGuard } from '../auth/guard/token.guard';
import { ActiveUser } from '../common/decorator/active-user.decorator';
import { ActiveUserInterface } from '../common/interface/active-user.interface';
import { CreateReportResponseDto } from './dtos/create-report-response.dto';
import { CreateReportDto } from './dtos/create-report.dto';
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
}
