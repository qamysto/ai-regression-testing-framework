import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AuthGuard } from "../common/auth.guard";
import { CommentsController } from "./comments.controller";

@Module({
  imports: [AuthModule],
  controllers: [CommentsController],
  providers: [AuthGuard]
})
export class CommentsModule {}
