import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuthGuard } from "../common/auth.guard";
import { RolesGuard } from "../common/roles.guard";
import { RequirementsController } from "./requirements.controller";

@Module({
  imports: [AuthModule],
  controllers: [RequirementsController],
  providers: [AuthGuard, RolesGuard]
})
export class RequirementsModule {}
