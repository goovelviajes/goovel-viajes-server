import { Controller, Get, InternalServerErrorException, Logger } from "@nestjs/common";
import { Public } from "./common/decorator/public-decorator";

@Controller()
export class AppController {
    @Get('debug-error')
    @Public()
    testError() {
        const logger = new Logger('DebugMode');
        logger.error('🚨 TEST: Error intencional para verificar Better Stack');
        throw new InternalServerErrorException('Error de prueba en Goovel');
    }
}