import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/current-user.decorator";
import { AuthGuard } from "../common/auth.guard";
import { AuthService } from "./auth.service";
import type { User } from "@regression/shared";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email);
  }

  @UseGuards(AuthGuard)
  @Get("me")
  me(@CurrentUser() user: User) {
    return user;
  }
}
