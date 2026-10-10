import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module";
import { CommentsModule } from "./comments/comments.module";
import { ProjectsModule } from "./projects/projects.module";
import { ReportsModule } from "./reports/reports.module";
import { RequirementsModule } from "./requirements/requirements.module";
import { RunsModule } from "./runs/runs.module";
import { TestCasesModule } from "./test-cases/test-cases.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    ProjectsModule,
    RequirementsModule,
    TestCasesModule,
    RunsModule,
    CommentsModule,
    ReportsModule
  ]
})
export class AppModule {}
