import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthGuard } from "../common/auth.guard";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "local-dev-secret",
      signOptions: { expiresIn: "12h" }
    })
  ],
  controllers: [AuthController],
  providers: [AuthGuard, AuthService],
  exports: [JwtModule, AuthService]
})
export class AuthModule {}
