"use server";

import { authClient } from "@/lib/auth";

export async function loginAction(credentials: {
  username: string;
  password: string;
}): Promise<{
  error?: string;
  success?: boolean;
}> {
  try {
    await authClient.signIn.email({
      email: credentials.username,
      password: credentials.password,
      fetchOptions: {
        onSuccess: () => {
          // Login successful - redirect will be handled by the form
        },
        onError: (error) => {
          console.error("Login error:", error);
          throw new Error("Login failed");
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Invalid username/email or password", success: false };
  }
}
