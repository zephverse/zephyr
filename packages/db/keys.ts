import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const keys = createEnv({
  server: {
    DATABASE_URL: z
      .url()
      .default(
        "postgresql://postgres:postgres@localhost:5433/zephyr?schema=public"
      ),
    POSTGRES_PRISMA_URL: z
      .url()
      .default(
        "postgresql://postgres:postgres@localhost:5433/zephyr?schema=public"
      ),
    POSTGRES_URL_NON_POOLING: z
      .url()
      .default(
        "postgresql://postgres:postgres@localhost:5433/zephyr?schema=public"
      ),
    REDIS_URL: z.string().default("redis://:zephyrredis@localhost:6379/0"),

    NODE_ENV: z.enum(["development", "production"]).default("development"),
  },

  client: {
    // No client-side env vars needed for database or Redis
  },

  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
    POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING,
    REDIS_URL: process.env.REDIS_URL,
    NODE_ENV: process.env.NODE_ENV,
  },

  skipValidation: process.env.NODE_ENV === "production",
});
