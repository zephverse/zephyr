import { z } from "zod";
import { procedure, protectedProcedure, router } from "../../trpc";

export const userRouter = router({
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
});
