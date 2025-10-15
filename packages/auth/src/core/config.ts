/** biome-ignore-all lint/nursery/noShadow: it's required for username */
import { prisma } from "@zephyr/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, jwt, username } from "better-auth/plugins";
import type {
  DiscordProfile,
  GithubProfile,
  GoogleProfile,
  RedditProfile,
  TwitterProfile,
} from "better-auth/social-providers";
import { env } from "../../env";
import { hashPasswordWithScrypt, verifyPasswordWithScrypt } from "./password";

function deriveUsernameFromProfile(
  profile:
    | {
        email?: string;
        username?: string;
        login?: string;
        screen_name?: string;
      }
    | unknown
): string {
  const obj =
    profile && typeof profile === "object"
      ? (profile as Record<string, unknown>)
      : {};
  const email = typeof obj.email === "string" ? obj.email : undefined;
  const candidate =
    (typeof obj.username === "string" && obj.username) ||
    (typeof obj.login === "string" && obj.login) ||
    (typeof (obj as { screen_name?: string }).screen_name === "string" &&
      (obj as { screen_name?: string }).screen_name) ||
    (email ? email.split("@")[0] : "");
  const sanitized = String(candidate)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return sanitized || (email ? email.split("@")[0] : "user");
}

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
        role: {
          type: "string",
          required: true,
          defaultValue: "user",
        },
      },
    },

    plugins: [username(), jwt(), nextCookies(), adminPlugin()],

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      password: {
        // @ts-expect-error types are wrong
        hash: async (...args: unknown[]) => {
          const maybeInput = args[0];
          let plainPassword: string | undefined;
          if (typeof maybeInput === "string") {
            plainPassword = maybeInput;
          } else if (
            maybeInput !== null &&
            typeof maybeInput === "object" &&
            "password" in (maybeInput as Record<string, unknown>)
          ) {
            const candidate = (maybeInput as Record<string, unknown>).password;
            if (typeof candidate === "string") {
              plainPassword = candidate;
            }
          }
          if (typeof plainPassword !== "string") {
            throw new Error("Invalid password input for hashing");
          }
          const hash = await hashPasswordWithScrypt(plainPassword);
          return { hash };
        },
        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ...
        verify: async (...args: unknown[]) => {
          let plainPassword: unknown;
          let providedHash: unknown;
          if (args.length === 2) {
            [plainPassword, providedHash] = args;
          } else if (
            args.length === 1 &&
            args[0] !== null &&
            typeof args[0] === "object"
          ) {
            const obj = args[0] as Record<string, unknown>;
            plainPassword = obj.password;
            providedHash = obj.hash;
          }

          if (typeof plainPassword !== "string") {
            return false;
          }

          let stored: string | undefined;
          if (typeof providedHash === "string") {
            try {
              const parsed = JSON.parse(providedHash);
              if (
                parsed &&
                typeof parsed === "object" &&
                "hash" in (parsed as Record<string, unknown>) &&
                typeof (parsed as Record<string, unknown>).hash === "string"
              ) {
                stored = (parsed as Record<string, string>).hash;
              } else {
                stored = providedHash;
              }
            } catch {
              stored = providedHash;
            }
          } else if (
            providedHash !== null &&
            typeof providedHash === "object" &&
            "hash" in (providedHash as Record<string, unknown>) &&
            typeof (providedHash as Record<string, unknown>).hash === "string"
          ) {
            stored = (providedHash as Record<string, string>).hash;
          }

          if (typeof stored !== "string") {
            return false;
          }

          return await verifyPasswordWithScrypt(plainPassword, stored);
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
        redirectURI: `${env.NEXT_PUBLIC_AUTH_URL}/api/auth/callback/google`,
        mapProfileToUser(profile: GoogleProfile): { username: string } {
          const username = deriveUsernameFromProfile(profile);
          return { username };
        },
      },
      github: {
        clientId: env.GITHUB_CLIENT_ID || "",
        clientSecret: env.GITHUB_CLIENT_SECRET || "",
        redirectURI: `${env.NEXT_PUBLIC_AUTH_URL}/api/auth/callback/github`,
        mapProfileToUser(profile: GithubProfile): { username: string } {
          const username = deriveUsernameFromProfile(profile);
          return { username };
        },
      },
      discord: {
        clientId: env.DISCORD_CLIENT_ID || "",
        clientSecret: env.DISCORD_CLIENT_SECRET || "",
        redirectURI: `${env.NEXT_PUBLIC_AUTH_URL}/api/auth/callback/discord`,
        mapProfileToUser(profile: DiscordProfile): { username: string } {
          const username = deriveUsernameFromProfile(profile);
          return { username };
        },
      },
      twitter: {
        clientId: env.TWITTER_CLIENT_ID || "",
        clientSecret: env.TWITTER_CLIENT_SECRET || "",
        redirectURI: `${env.NEXT_PUBLIC_AUTH_URL}/api/auth/callback/twitter`,
        mapProfileToUser(profile: TwitterProfile): { username: string } {
          const username = deriveUsernameFromProfile(profile);
          return { username };
        },
      },
      reddit: {
        clientId: env.REDDIT_CLIENT_ID || "",
        clientSecret: env.REDDIT_CLIENT_SECRET || "",
        redirectURI: `${env.NEXT_PUBLIC_AUTH_URL}/api/auth/callback/reddit`,
        mapProfileToUser(profile: RedditProfile): { username: string } {
          const username = deriveUsernameFromProfile(profile);
          return { username };
        },
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
      ...(environment === "production"
        ? {
            crossSubDomainCookies: {
              enabled: true,
              domain: ".zephyyrr.in",
            },
          }
        : {}),
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
      env.NEXT_PUBLIC_AUTH_URL,
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
