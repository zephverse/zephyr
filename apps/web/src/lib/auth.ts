import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// Point the client to this app's origin so cookies are set for the web domain
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
  plugins: [usernameClient()],
});

export type { Session, User } from "@zephyr/auth/core";
