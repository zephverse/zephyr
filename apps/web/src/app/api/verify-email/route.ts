// Email verification is now handled automatically by Better Auth
// This route can be removed or used for custom verification logic if needed

import type { NextRequest } from "next/server";

export function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return Response.redirect("/verify-email?error=invalid-token");
  }

  // Redirect to Better Auth email verification
  const baseUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3001";
  return Response.redirect(`${baseUrl}/api/auth/verify-email?token=${token}`);
}
