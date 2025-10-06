/** biome-ignore-all lint/style/useNamingConvention: ENV VARS */
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = createEnv({
  server: {
    DATABASE_URL: z.url(),
    POSTGRES_PRISMA_URL: z.url(),
    POSTGRES_URL_NON_POOLING: z.url(),
    RESEND_API_KEY: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    DISCORD_CLIENT_ID: z.string().optional(),
    DISCORD_CLIENT_SECRET: z.string().optional(),
    TWITTER_CLIENT_ID: z.string().optional(),
    TWITTER_CLIENT_SECRET: z.string().optional(),
    BETTER_AUTH_SECRET: z.string().min(1),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
    NEXT_TELEMETRY_DISABLED: z.enum(["0", "1"]).default("1"),
    TURBO_TELEMETRY_DISABLED: z.enum(["0", "1"]).default("1"),
    BETTER_AUTH_TELEMETRY: z.enum(["0", "1"]).default("0"),
    SUPPORT_EMAIL: z.email().default("info@zephyyrr.in"),
  },

  client: {
    NEXT_PUBLIC_AUTH_URL: z.url().default("http://localhost:3001"),
    NEXT_PUBLIC_URL: z.url().default("http://localhost:3000"),
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED,
    TURBO_TELEMETRY_DISABLED: process.env.TURBO_TELEMETRY_DISABLED,
    BETTER_AUTH_TELEMETRY: process.env.BETTER_AUTH_TELEMETRY,
    NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL,
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
  },

  skipValidation: process.env.NODE_ENV === "production",
});
