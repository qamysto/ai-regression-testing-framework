import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import type { ReviewStatus } from "@regression/shared";
import { AuthGuard } from "../common/auth.guard";
import { store } from "../common/in-memory.store";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";

@UseGuards(AuthGuard, RolesGuard)
@Controller("test-cases")
export class TestCasesController {
  @Get()
  list() {
    return store.testCases;
  }

  @Roles("admin", "qa")
  @Patch(":id/review")
  review(@Param("id") id: string, @Body() body: { reviewStatus: ReviewStatus }) {
    const testCase = store.testCases.find((candidate) => candidate.id === id);
    if (!testCase) {
      return { ok: false };
    }
    testCase.reviewStatus = body.reviewStatus;
    return testCase;
  }
}
