import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuthGuard } from "../common/auth.guard";
import { ProjectsController } from "./projects.controller";

@Module({
  imports: [AuthModule],
  controllers: [ProjectsController],
  providers: [AuthGuard]
})
export class ProjectsModule {}
