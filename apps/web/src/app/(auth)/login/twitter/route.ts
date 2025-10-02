import { authClient } from "@/lib/auth";

export async function GET() {
  // Redirect to Better Auth Twitter OAuth
  const url = await authClient.signIn.social({
    provider: "twitter",
    callbackURL: "/",
  });

  return Response.redirect(url.url);
}
