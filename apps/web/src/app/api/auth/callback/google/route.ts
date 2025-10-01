import { google, lucia, validateRequest } from "@zephyr/auth/auth";
import { createStreamUser } from "@zephyr/auth/src";
import { prisma } from "@zephyr/db";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { slugify } from "@/lib/utils";

async function validateCallbackParams(req: NextRequest): Promise<{
  code: string;
  state: string;
  storedState: string;
  storedCodeVerifier: string;
  isLinking: boolean;
}> {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const storedState = (await cookies()).get("state")?.value;
  const storedCodeVerifier = (await cookies()).get("code_verifier")?.value;
  const isLinking = (await cookies()).get("linking")?.value === "true";

  if (
    !(code && state && storedState && storedCodeVerifier) ||
    state !== storedState
  ) {
    throw new Error("Invalid callback parameters");
  }

  return { code, state, storedState, storedCodeVerifier, isLinking };
}

async function getGoogleUser(code: string, storedCodeVerifier: string) {
  let tokenResponse: { data?: { access_token?: string } };
  try {
    tokenResponse = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier
    );
  } catch (error) {
    console.error("Token validation error:", error);
    throw error;
  }

  // @ts-expect-error
  const accessToken = tokenResponse?.data?.access_token;
  if (!accessToken || typeof accessToken !== "string") {
    throw new Error("Invalid access token structure");
  }

  const response = await fetch(
    "https://www.googleapis.com/oauth2/v1/userinfo",
    {
      method: "GET",
      headers: {
        authorization: `Bearer ${accessToken}`,
        accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function GET(req: NextRequest) {
  try {
    const { code, storedCodeVerifier, isLinking } =
      await validateCallbackParams(req);
    const googleUser = await getGoogleUser(code, storedCodeVerifier);

    if (isLinking) {
      const { user } = await validateRequest();
      if (!user) {
        return new Response(null, {
          status: 302,
          headers: {
            location: "/login",
          },
        });
      }

      const existingGoogleUser = await prisma.user.findUnique({
        where: {
          googleId: googleUser.id,
        },
      });

      if (existingGoogleUser && existingGoogleUser.id !== user.id) {
        return new Response(null, {
          status: 302,
          headers: {
            location: "/settings?error=google_account_linked",
          },
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { googleId: googleUser.id },
      });

      (await cookies()).set("linking", "", { maxAge: 0 });

      return new Response(null, {
        status: 302,
        headers: {
          location: "/settings?success=google_linked",
        },
      });
    }

    const existingUserWithEmail = await prisma.user.findUnique({
      where: {
        email: googleUser.email,
      },
    });

    if (existingUserWithEmail && !existingUserWithEmail.googleId) {
      return new Response(null, {
        status: 302,
        headers: {
          location: `/login/error?error=email_exists&email=${encodeURIComponent(googleUser.email)}`,
        },
      });
    }

    const existingGoogleUser = await prisma.user.findUnique({
      where: {
        googleId: googleUser.id,
      },
    });

    if (existingGoogleUser) {
      // @ts-expect-error
      const session = await lucia.createSession(existingGoogleUser.id, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );
      return new Response(null, {
        status: 302,
        headers: {
          location: "/",
        },
      });
    }

    const userId = generateIdFromEntropySize(10);
    const username = `${slugify(googleUser.name)}-${userId.slice(0, 4)}`;

    try {
      const newUser = await prisma.user.create({
        data: {
          id: userId,
          username,
          displayName: googleUser.name,
          googleId: googleUser.id,
          email: googleUser.email,
          avatarUrl: googleUser.picture,
          emailVerified: true,
        },
      });

      try {
        await createStreamUser({
          userId: newUser.id,
          username: newUser.username,
          displayName: newUser.displayName,
        });
      } catch (streamError) {
        console.error("Failed to create Stream user:", streamError);
      }

      // @ts-expect-error
      const session = await lucia.createSession(userId, {});
      const sessionCookie = lucia.createSessionCookie(session.id);
      (await cookies()).set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes
      );

      return new Response(null, {
        status: 302,
        headers: {
          location: "/",
        },
      });
    } catch (error) {
      console.error("User creation error:", error);
      throw error;
    }
  } catch (error) {
    console.error("Final error catch:", error);
    if (error instanceof OAuth2RequestError) {
      return new Response(null, { status: 400 });
    }
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
