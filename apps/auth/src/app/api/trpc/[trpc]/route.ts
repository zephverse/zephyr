import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/routers/app";
import { createContext } from "@/server/trpc";

const handler = (request: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext,
    onError({ error, path, input }) {
      console.error("tRPC error", {
        path,
        message: error.message,
        code: error.code,
        input,
      });
    },
  });

export { handler as GET, handler as POST };
