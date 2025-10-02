import type { NextRequest } from "next/server";
import { auth } from "./config";
import type { AuthContext } from "./types";

export async function getSessionFromRequest(
  req: Request | NextRequest
): Promise<AuthContext> {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return { session: null, user: null };
    }

    return {
      session: session.session,
      user: session.user,
    };
  } catch (error) {
    console.error("Error getting session:", error);
    return { session: null, user: null };
  }
}

export async function requireAuth(
  req: Request | NextRequest
): Promise<AuthContext> {
  const authContext = await getSessionFromRequest(req);

  if (!(authContext.user && authContext.session)) {
    throw new Error("Unauthorized");
  }

  return authContext;
}

export function optionalAuth(req: Request | NextRequest): Promise<AuthContext> {
  return getSessionFromRequest(req);
}
