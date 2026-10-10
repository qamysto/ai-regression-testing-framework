import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuthGuard } from "../common/auth.guard";
import { RunsController } from "./runs.controller";

@Module({
  imports: [AuthModule],
  controllers: [RunsController],
  providers: [AuthGuard]
})
export class RunsModule {}
