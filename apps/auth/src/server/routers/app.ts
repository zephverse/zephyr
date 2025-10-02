import { z } from "zod";
import { procedure, protectedProcedure, router } from "../trpc";
import { emailRouter } from "./email";

export const appRouter = router({
  hello: procedure.query(() => ({
    message: "Hello from Zephyr Auth Service",
  })),

  getSession: procedure.query(({ ctx }) => ({
    session: ctx.session,
    user: ctx.user,
  })),

  getProfile: protectedProcedure.query(({ ctx }) => ({
    user: ctx.user,
  })),

  updateProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().optional(),
        bio: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => ({
      success: true,
      message: "Profile update endpoint ready",
      userId: ctx.user.id,
      input,
    })),

  email: emailRouter,
});

export type AppRouter = typeof appRouter;
