import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuthGuard } from "../common/auth.guard";
import { RolesGuard } from "../common/roles.guard";
import { TestCasesController } from "./test-cases.controller";

@Module({
  imports: [AuthModule],
  controllers: [TestCasesController],
  providers: [AuthGuard, RolesGuard]
})
export class TestCasesModule {}
