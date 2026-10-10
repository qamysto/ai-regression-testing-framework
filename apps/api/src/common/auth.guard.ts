import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { store } from "./in-memory.store";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string>; user?: unknown }>();
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const payload = this.jwtService.verify<{ sub: string }>(token);
    const user = store.users.find((candidate) => candidate.id === payload.sub);

    if (!user) {
      throw new UnauthorizedException("Unknown user");
    }

    request.user = user;
    return true;
  }
}
