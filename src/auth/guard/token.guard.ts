import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from 'src/common/decorator/public-decorator';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TokenGuard implements CanActivate {
  private readonly logger: Logger = new Logger(TokenGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.getTokenFromHeaders(request);
    const path = request.url;
    const method = request.method;
    const ip = request.ip;

    if (!token) {
      this.logger.warn(`[AUTH_FAILED] - No Token - Path: ${method} ${path} - IP: ${ip}`);
      throw new UnauthorizedException('You need a token to get access');
    }

    const secretKey = process.env.SECRET_KEY;

    if (!secretKey) {
      this.logger.error(`[CRITICAL_CONFIG] - Secret key missing in environment variables`);
      throw new InternalServerErrorException('Secret key required');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: secretKey,
      });

      request['user'] = {
        id: payload.sub,
        role: payload.role
      }

      return true;
    } catch (error) {
      const logDetails = `Path: ${method} ${path} - IP: ${ip} - Message: ${error.message}`;

      if (error instanceof HttpException) {
        this.logger.warn(`[AUTH_HTTP_EXCEPTION] - Status: ${error.getStatus()} - ${logDetails}`);
        throw error;
      }

      if (error.name === 'TokenExpiredError') {
        this.logger.warn(`[AUTH_EXPIRED] - ${logDetails}`);
        throw new UnauthorizedException('Token expirado');
      }

      if (error.name === 'JsonWebTokenError') {
        this.logger.warn(`[AUTH_INVALID] - ${logDetails}`);
        throw new UnauthorizedException('Invalid token');
      }

      this.logger.error(`[AUTH_UNKNOWN_ERROR] - ${logDetails}`, error.stack);
      throw new InternalServerErrorException('Token guard error');
    }
  }

  private getTokenFromHeaders(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
