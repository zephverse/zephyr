import { procedure, router } from "../trpc";

export const appRouter = router({
  hello: procedure.query(() => ({ message: "Hello from Zephyr Auth Service" })),
});

export type AppRouter = typeof appRouter;
