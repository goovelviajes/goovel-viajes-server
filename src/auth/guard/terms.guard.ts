import { ForbiddenException, Injectable } from "@nestjs/common";
import { CanActivate, ExecutionContext } from "@nestjs/common";
import { TermsService } from "../../terms/terms.service";
import { Reflector } from "@nestjs/core";
import { SKIP_TERMS_KEY } from "../../common/decorator/skip-terms.decorator";
import { IS_PUBLIC_KEY } from "../../common/decorator/public-decorator";

@Injectable()
export class TermsGuard implements CanActivate {
  constructor(private termsService: TermsService, private reflector: Reflector) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const skipTerms = this.reflector.getAllAndOverride<boolean>(SKIP_TERMS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic || skipTerms) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 1. Verificación de seguridad: ¿Está logueado?
    if (!user || !user.id) {
      // Si la ruta no es skipTerms pero no hay usuario, 
      // probablemente el TokenGuard falló o no se ejecutó.
      return true; // O puedes lanzar una UnauthorizedException si prefieres ser estricto
    }

    try {
      const accepted = await this.termsService.hasAcceptedLatest(user.id);

      if (!accepted) {
        throw new ForbiddenException({
          message: 'Must accept terms and conditions to continue',
          code: 'TERMS_NOT_ACCEPTED'
        });
      }
      return true;
    } catch (error) {
      // Si es nuestra propia ForbiddenException, relanzarla
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // Si es otro error (ej. base de datos), loguear y denegar por seguridad
      console.error('TermsGuard Error:', error);
      return false;
    }
  }
}