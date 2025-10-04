import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";
import { auth } from "@/auth/config";
import { appRouter } from "@/server/routers/app";
import { createContext } from "@/server/trpc";

const betterAuthHandler = toNextJsHandler(auth);

function isTrpc(req: NextRequest) {
  return (
    req.nextUrl.pathname.endsWith("/api/auth/pending-signup") ||
    req.nextUrl.pathname.endsWith("/api/auth/pending-verify") ||
    req.nextUrl.pathname.endsWith("/api/auth/pending-resend")
  );
}

export function GET(req: NextRequest) {
  if (isTrpc(req)) {
    return fetchRequestHandler({
      endpoint: "/api/auth",
      req: req as unknown as Request,
      router: appRouter,
      createContext,
    });
  }
  return betterAuthHandler.GET(req);
}

export function POST(req: NextRequest) {
  if (isTrpc(req)) {
    return fetchRequestHandler({
      endpoint: "/api/auth",
      req: req as unknown as Request,
      router: appRouter,
      createContext,
    });
  }
  return betterAuthHandler.POST(req);
}
