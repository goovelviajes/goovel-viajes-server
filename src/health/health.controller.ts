import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/common/decorator/public-decorator';

@Controller('healthz')
export class HealthController {
    @Get()
    @Public()
    check() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
}
