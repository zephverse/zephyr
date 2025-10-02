import { authClient } from "@/lib/auth";

export async function GET() {
  // Redirect to Better Auth Google OAuth
  const url = await authClient.signIn.social({
    provider: "google",
    callbackURL: "/",
  });

  return Response.redirect(url.url);
}
