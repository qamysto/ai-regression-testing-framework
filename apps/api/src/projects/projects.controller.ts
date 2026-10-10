import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { AuthGuard } from "../common/auth.guard";
import { store } from "../common/in-memory.store";
import type { Project } from "@regression/shared";

@UseGuards(AuthGuard)
@Controller("projects")
export class ProjectsController {
  @Get()
  list() {
    return store.projects;
  }

  @Post()
  create(@Body() body: Pick<Project, "name" | "baseUrl" | "environmentConfig">) {
    const project: Project = {
      id: uuid(),
      name: body.name,
      baseUrl: body.baseUrl,
      environmentConfig: body.environmentConfig ?? {}
    };
    store.projects.push(project);
    return project;
  }
}
