import { discord, lucia, validateRequest } from "@zephyr/auth/auth";
import { prisma } from "@zephyr/db";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: OAuth callback logic requires multiple validation steps
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const storedState = (await cookies()).get("state")?.value;
    const isLinking = (await cookies()).get("linking")?.value === "true";

    if (!(code && state && storedState) || state !== storedState) {
      return new Response(null, { status: 400 });
    }

    try {
      const tokens = await discord.validateAuthorizationCode(code);
      const accessToken = tokens.accessToken;

      if (!accessToken) {
        console.error("No access token found in response:", tokens);
        throw new Error("No access token received from Discord");
      }

      console.log("Discord access token:", accessToken);

      const discordUserResponse = await fetch(
        "https://discord.com/api/v10/users/@me",
        {
          headers: {
            authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const responseText = await discordUserResponse.text();
      if (!discordUserResponse.ok) {
        throw new Error(`Failed to fetch Discord user: ${responseText}`);
      }

      const discordUser = JSON.parse(responseText);
      if (!discordUser.email) {
        throw new Error("No email provided by Discord");
      }

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

        const existingDiscordUser = await prisma.user.findUnique({
          where: {
            discordId: discordUser.id,
          },
        });

        if (existingDiscordUser && existingDiscordUser.id !== user.id) {
          return new Response(null, {
            status: 302,
            headers: {
              location: "/settings?error=discord_account_linked_other",
            },
          });
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { discordId: discordUser.id },
        });

        (await cookies()).set("linking", "", { maxAge: 0 });

        return new Response(null, {
          status: 302,
          headers: {
            location: "/settings?success=discord_linked",
          },
        });
      }

      const existingUserWithEmail = await prisma.user.findUnique({
        where: {
          email: discordUser.email,
        },
      });

      if (existingUserWithEmail && !existingUserWithEmail.discordId) {
        return new Response(null, {
          status: 302,
          headers: {
            location: `/login/error?error=email_exists&email=${encodeURIComponent(discordUser.email)}`,
          },
        });
      }

      const existingDiscordUser = await prisma.user.findUnique({
        where: {
          discordId: discordUser.id,
        },
      });

      if (existingDiscordUser) {
        const session = await lucia.createSession(existingDiscordUser.id, {});
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
      const username = `${slugify(discordUser.username)}-${userId.slice(0, 4)}`;

      try {
        await prisma.$transaction(async (tx) => {
          const _newUser = await tx.user.create({
            data: {
              id: userId,
              username,
              displayName: discordUser.global_name || discordUser.username,
              discordId: discordUser.id,
              email: discordUser.email,
              avatarUrl: discordUser.avatar
                ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
                : null,
              emailVerified: true,
            },
          });
        });

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
        console.error("Transaction error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Discord API error:", error);
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
