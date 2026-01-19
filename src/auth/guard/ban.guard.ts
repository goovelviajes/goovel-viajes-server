import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from 'src/common/decorator/public-decorator';
import { UserService } from 'src/user/user.service';

@Injectable()
export class BanGuard implements CanActivate {
  constructor(
    private readonly userService: UserService,
    private readonly reflector: Reflector
  ) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) return true;

    const userDB = await this.userService.getUserById(user.id);

    if (userDB.isBanned) {
      throw new ForbiddenException({
        message: 'Your account has been banned',
        code: 'USER_BANNED',
      });
    }

    return true;
  }
}
