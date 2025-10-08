import { prisma } from "@zephyr/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { jwt, username } from "better-auth/plugins";
import { env } from "../../env";
import { hashPasswordWithScrypt, verifyPasswordWithScrypt } from "./password";

export type EmailService = {
  sendVerificationEmail?: (
    email: string,
    token: string
  ) => Promise<{ success: boolean; error?: string; verificationUrl?: string }>;
  sendPasswordResetEmail?: (
    email: string,
    token: string
  ) => Promise<{ success: boolean; error?: string; resetUrl?: string }>;
};

export type AuthConfig = {
  emailService?: EmailService;
  environment?: "development" | "production";
};

export function createAuthConfig(config: AuthConfig = {}) {
  const { emailService, environment = env.NODE_ENV || "development" } = config;

  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),

    user: {
      fields: {
        name: "displayName",
      },
      additionalFields: {
        username: {
          type: "string",
          required: true,
        },
        displayUsername: {
          type: "string",
          required: false,
        },
      },
    },

    plugins: [username(), jwt(), nextCookies()],

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      password: {
        // @ts-expect-error types are wrong
        hash: async ({ password }) => {
          const hash = await hashPasswordWithScrypt(password);
          return { hash };
        },
        verify: async ({ password, hash }) => {
          let stored: string;
          if (typeof hash === "string") {
            try {
              const parsed = JSON.parse(hash);
              stored = parsed.hash || hash;
            } catch {
              stored = hash;
            }
          } else {
            stored = (hash as { hash: string }).hash;
          }
          return await verifyPasswordWithScrypt(password, stored);
        },
      },
      sendResetPassword: emailService?.sendPasswordResetEmail
        ? async ({ user, url }) => {
            await emailService.sendPasswordResetEmail?.(
              user.email,
              url.split("/").pop() || ""
            );
          }
        : ({ user, url }) => {
            if (environment === "development") {
              console.log(`Reset password email for ${user.email}: ${url}`);
            } else {
              throw new Error("Password reset email service not configured");
            }
            return Promise.resolve();
          },
    },

    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID || "",
        clientSecret: env.GOOGLE_CLIENT_SECRET || "",
        redirectURI: `${env.NEXT_PUBLIC_URL}/api/auth/callback/google`,
      },
      github: {
        clientId: env.GITHUB_CLIENT_ID || "",
        clientSecret: env.GITHUB_CLIENT_SECRET || "",
        redirectURI: `${env.NEXT_PUBLIC_URL}/api/auth/callback/github`,
      },
      discord: {
        clientId: env.DISCORD_CLIENT_ID || "",
        clientSecret: env.DISCORD_CLIENT_SECRET || "",
        redirectURI: `${env.NEXT_PUBLIC_URL}/api/auth/callback/discord`,
      },
      twitter: {
        clientId: env.TWITTER_CLIENT_ID || "",
        clientSecret: env.TWITTER_CLIENT_SECRET || "",
        redirectURI: `${env.NEXT_PUBLIC_URL}/api/auth/callback/twitter`,
      },
      reddit: {
        clientId: env.REDDIT_CLIENT_ID || "",
        clientSecret: env.REDDIT_CLIENT_SECRET || "",
        redirectURI: `${env.NEXT_PUBLIC_URL}/api/auth/callback/reddit`,
      },
    },

    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google", "github", "discord", "reddit", "twitter"],
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: false,
      },
      // freshAge can protect sensitive actions; keep default or tune as needed
    },

    advanced: {
      useSecureCookies: environment === "production",
      database: {
        generateId: crypto.randomUUID,
      },
      // cookiePrefix can be set if multiple auth stacks coexist
    },

    verification: {
      modelName: "verification",
    },

    trustedOrigins: [
      env.NEXT_PUBLIC_URL,
      "http://localhost:3000",
      "http://localhost:3001",
      "https://zephyyrr.in",
    ],

    telemetry: {
      enabled: false,
    },

    ...(emailService?.sendVerificationEmail && {
      emailVerification: {
        sendVerificationEmail: async ({ user, url }) => {
          let token = "";
          try {
            const parsed = new URL(url);
            token =
              parsed.searchParams.get("token") ||
              parsed.pathname.split("/").filter(Boolean).pop() ||
              "";
          } catch {
            token = url.split("/").pop() || "";
          }
          await emailService.sendVerificationEmail?.(user.email, token);
        },
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
      },
    }),
  });
}

export const auth = createAuthConfig();
