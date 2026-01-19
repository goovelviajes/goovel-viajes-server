import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP_PERFORMANCE');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const { method, url, ip } = request;

        // Guardamos el momento exacto en que entra la petición
        const startTime = Date.now();

        return next.handle().pipe(
            tap(() => {
                // Calculamos cuánto tiempo pasó hasta que se resolvió
                const endTime = Date.now();
                const duration = endTime - startTime;

                const message = `${method} ${url} - IP: ${ip} - Duration: ${duration}ms`;

                // Si tarda más de 1 segundo, lo logueamos como advertencia para optimizar
                if (duration > 1000) {
                    this.logger.warn(`[SLOW_QUERY] ${message}`);
                } else {
                    this.logger.log(`[PERF] ${message}`);
                }
            }),
        );
    }
}