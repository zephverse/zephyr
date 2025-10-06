import type { AuthContext } from "@zephyr/auth/core";
import { prisma } from "@zephyr/db";
import type { NextRequest } from "next/server";
import { auth } from "./config";

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

    // Fetch username from database
    const userData = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true },
    });

    return {
      session: session.session,
      user: {
        ...session.user,
        username: userData?.username || "",
      },
    };
  } catch (error) {
    console.error("Error getting session:", error);
    return { session: null, user: null };
  }
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
