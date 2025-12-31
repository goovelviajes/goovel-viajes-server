import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class TokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const token = this.getTokenFromHeaders(request);

    if (!token) {
      throw new UnauthorizedException('You need a token to get access');
    }

    const secretKey = process.env.SECRET_KEY;

    if (!secretKey) {
      throw new UnauthorizedException('Secret key required');
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
      if (error instanceof HttpException) {
        throw error;
      }

      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }

      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expirado');
      }

      throw new InternalServerErrorException('Token guard error');
    }
  }

  private getTokenFromHeaders(request: Request) {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
