"use server";

import { authClient } from "@/lib/auth";

export async function logout() {
  try {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          // Handle successful logout if needed
        },
        onError: (error) => {
          console.error("Logout error:", error);
        },
      },
    });

    return { redirect: "/login" };
  } catch (error) {
    console.error("Session invalidation error:", error);
    return { error: "Logout failed" };
  }
}
