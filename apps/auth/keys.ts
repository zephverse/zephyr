/** biome-ignore-all lint/style/useNamingConvention: ENV VARS */
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = createEnv({
  server: {
    // Database
    POSTGRES_USER: z.string().min(1).default("postgres"),
    POSTGRES_PASSWORD: z.string().min(1).default("postgres"),
    POSTGRES_DB: z.string().min(1).default("zephyr"),
    POSTGRES_PORT: z
      .string()
      .transform((val) => Number.parseInt(val, 10))
      .default("5433"),
    POSTGRES_HOST: z.string().min(1).default("localhost"),
    DATABASE_URL: z.url(),
    POSTGRES_PRISMA_URL: z.url(),
    POSTGRES_URL_NON_POOLING: z.url(),

    // Redis
    REDIS_PASSWORD: z.string().min(1),
    REDIS_PORT: z
      .string()
      .transform((val) => Number.parseInt(val, 10))
      .default("6379"),
    REDIS_HOST: z.string().min(1).default("localhost"),
    REDIS_URL: z.url(),

    // Email
    RESEND_API_KEY: z.string().min(1),

    // Auth providers
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    DISCORD_CLIENT_ID: z.string().optional(),
    DISCORD_CLIENT_SECRET: z.string().optional(),
    TWITTER_CLIENT_ID: z.string().optional(),
    TWITTER_CLIENT_SECRET: z.string().optional(),

    // Environment
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    NEXT_TELEMETRY_DISABLED: z.enum(["0", "1"]).default("1"),
    TURBO_TELEMETRY_DISABLED: z.enum(["0", "1"]).default("1"),

    // Support
    SUPPORT_EMAIL: z.email().default("support@zephyyrr.in"),
  },

  client: {
    NEXT_PUBLIC_AUTH_URL: z.url().default("http://localhost:3001"),
    NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  },

  runtimeEnv: {
    // Database
    POSTGRES_USER: process.env.POSTGRES_USER,
    POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
    POSTGRES_DB: process.env.POSTGRES_DB,
    POSTGRES_PORT: process.env.POSTGRES_PORT,
    POSTGRES_HOST: process.env.POSTGRES_HOST,
    DATABASE_URL: process.env.DATABASE_URL,
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,

    // Redis
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_PORT: process.env.REDIS_PORT,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_URL: process.env.REDIS_URL,

    // Email
    RESEND_API_KEY: process.env.RESEND_API_KEY,

    // Auth providers
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,

    // Environment
    NODE_ENV: process.env.NODE_ENV,
    NEXT_TELEMETRY_DISABLED: process.env.NEXT_TELEMETRY_DISABLED,
    TURBO_TELEMETRY_DISABLED: process.env.TURBO_TELEMETRY_DISABLED,

    // Client
    NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,

    // Support
    SUPPORT_EMAIL: process.env.SUPPORT_EMAIL,
  },

  skipValidation: process.env.NODE_ENV === "production",
});
