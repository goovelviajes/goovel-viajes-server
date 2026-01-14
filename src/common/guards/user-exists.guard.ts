import { CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/user/entities/user.entity";
import { Repository } from "typeorm";

export class UserExistsGuard implements CanActivate {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>
    ) { }

    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.id) {
            return true
        }

        const userExists = await this.userRepository.findOne({ where: { id: user.id } });

        if (!userExists) throw new UnauthorizedException("User not found")

        return true
    }
}