import { authClient } from "@/lib/auth";

export async function GET() {
  // Redirect to Better Auth Discord OAuth
  const url = await authClient.signIn.social({
    provider: "discord",
    callbackURL: "/",
  });

  return Response.redirect(url.url);
}
