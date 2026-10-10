import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuthGuard } from "../common/auth.guard";
import { ReportsController } from "./reports.controller";

@Module({
  imports: [AuthModule],
  controllers: [ReportsController],
  providers: [AuthGuard]
})
export class ReportsModule {}
