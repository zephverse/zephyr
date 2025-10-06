/** biome-ignore-all lint/style/useNamingConvention: ENV VARS */
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = createEnv({
  server: {
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    DISCORD_CLIENT_ID: z.string().optional(),
    DISCORD_CLIENT_SECRET: z.string().optional(),
    TWITTER_CLIENT_ID: z.string().optional(),
    TWITTER_CLIENT_SECRET: z.string().optional(),
    REDDIT_CLIENT_ID: z.string().optional(),
    REDDIT_CLIENT_SECRET: z.string().optional(),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
  },

  client: {
    NEXT_PUBLIC_URL: z.url().default("http://localhost:3000"),
    NEXT_PUBLIC_AUTH_URL: z.url().default("http://localhost:3001"),
  },

  runtimeEnv: {
    REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID,
    REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID,
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
  },

  skipValidation: process.env.NODE_ENV === "production",
});
