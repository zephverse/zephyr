"use server";

import { authClient } from "@/lib/auth";

export async function loginAction(credentials: {
  email: string;
  password: string;
}): Promise<{
  error?: string;
  success?: boolean;
}> {
  try {
    await authClient.signIn.email({
      email: credentials.email,
      password: credentials.password,
      fetchOptions: {
        onSuccess: () => {
          // Login successful - redirect will be handled by the form
        },
        onError: (error) => {
          console.error("Login error:", error);
          return { error: error.message || "Login failed", success: false };
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Invalid email or password", success: false };
  }
}
