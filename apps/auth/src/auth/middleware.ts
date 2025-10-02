import type { AuthContext } from "@zephyr/auth/core";
import type { NextRequest } from "next/server";
import { auth } from "./config";

export async function getSessionFromRequest(
  req: Request | NextRequest
): Promise<AuthContext> {
  const authRequest = auth.authRequest(req);
  const session = await authRequest.validate();
  return { session, user: session?.user ?? null };
}

export async function requireAuth(req: Request | NextRequest): Promise<{
  session: AuthContext["session"];
  user: AuthContext["user"];
}> {
  const { session, user } = await getSessionFromRequest(req);
  if (!(session && user)) {
    throw new Error("Unauthorized");
  }
  return { session, user };
}

export function optionalAuth(req: Request | NextRequest): Promise<AuthContext> {
  return getSessionFromRequest(req);
}
