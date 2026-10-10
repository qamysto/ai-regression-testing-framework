import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { store } from "../common/in-memory.store";

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  login(email: string) {
    const user = store.users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return {
      accessToken: this.jwtService.sign({ sub: user.id, role: user.role }),
      user
    };
  }
}
