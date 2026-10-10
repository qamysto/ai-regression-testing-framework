import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { buildDraftTestCases } from "@regression/ai";
import type { Requirement, TestCase } from "@regression/shared";
import { v4 as uuid } from "uuid";
import { AuthGuard } from "../common/auth.guard";
import { store } from "../common/in-memory.store";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";

@UseGuards(AuthGuard, RolesGuard)
@Controller("requirements")
export class RequirementsController {
  @Get()
  list() {
    return store.requirements;
  }

  @Roles("admin", "qa")
  @Post()
  create(@Body() body: Omit<Requirement, "id" | "status">) {
    const requirement: Requirement = {
      id: uuid(),
      status: "ready",
      ...body
    };
    store.requirements.push(requirement);
    return requirement;
  }

  @Roles("admin", "qa")
  @Post(":id/generate-tests")
  generateTests(@Param("id") id: string, @Body() body: { suiteId?: string }) {
    const requirement = store.requirements.find((candidate) => candidate.id === id);
    if (!requirement) {
      return { generated: [] };
    }

    const suiteId = body.suiteId ?? "suite-demo";
    const generated: TestCase[] = buildDraftTestCases(requirement).map((draft) => ({
      ...draft,
      id: uuid(),
      suiteId
    }));

    store.testCases.push(...generated);
    return { generated };
  }
}
