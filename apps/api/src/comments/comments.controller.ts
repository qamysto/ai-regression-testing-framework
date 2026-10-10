import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import type { Comment, User } from "@regression/shared";
import { v4 as uuid } from "uuid";
import { AuthGuard } from "../common/auth.guard";
import { CurrentUser } from "../common/current-user.decorator";
import { store } from "../common/in-memory.store";

@UseGuards(AuthGuard)
@Controller("comments")
export class CommentsController {
  @Get(":targetType/:targetId")
  list(@Param("targetType") targetType: "run" | "result", @Param("targetId") targetId: string) {
    return store.comments.filter((comment) => comment.targetType === targetType && comment.targetId === targetId);
  }

  @Post()
  create(@CurrentUser() user: User, @Body() body: Omit<Comment, "id" | "userId" | "createdAt">) {
    const comment: Comment = {
      id: uuid(),
      userId: user.id,
      createdAt: new Date().toISOString(),
      ...body
    };
    store.comments.push(comment);
    return comment;
  }
}
