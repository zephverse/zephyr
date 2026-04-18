import { createAuthClient } from "better-auth/react";
import { env } from "../../env";

export const authClient: ReturnType<typeof createAuthClient> = createAuthClient(
  {
    baseURL: env.NEXT_PUBLIC_AUTH_URL,
  }
);

export type AuthClient = typeof authClient;
