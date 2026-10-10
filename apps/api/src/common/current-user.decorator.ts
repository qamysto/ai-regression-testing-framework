import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { User } from "@regression/shared";

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): User => {
  const request = context.switchToHttp().getRequest<{ user: User }>();
  return request.user;
});
