import { router } from "../trpc";
import { authRouter } from "./auth";
import { securityRouter } from "./security";
import { signupRouter } from "./signup";
import { userRouter } from "./user";

export const appRouter = router({
  // Authentication procedures
  ...authRouter._def.procedures,

  // User management procedures
  ...userRouter._def.procedures,

  // Security procedures
  ...securityRouter._def.procedures,

  // Signup procedures
  ...signupRouter._def.procedures,
});

export type AppRouter = typeof appRouter;
