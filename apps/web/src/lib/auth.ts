import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
  fetchOptions: {
    credentials: "include",
    headers: {
      "Cache-Control": "no-cache",
    },
  },
  plugins: [usernameClient()],
});

export type { Session, User } from "@zephyr/auth/core";
