import { authClient } from "@/lib/auth";

export async function GET() {
  // Redirect to Better Auth GitHub OAuth
  const url = await authClient.signIn.social({
    provider: "github",
    callbackURL: "/",
  });

  return Response.redirect(url.url);
}
