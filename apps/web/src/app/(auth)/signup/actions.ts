"use server";

import { authClient } from "@/lib/auth";

type SignUpResponse = {
  error?: string;
  success: boolean;
  message?: string;
};

export async function signUp(credentials: {
  name: string;
  email: string;
  password: string;
}): Promise<SignUpResponse> {
  try {
    await authClient.signUp.email({
      email: credentials.email,
      password: credentials.password,
      name: credentials.name,
      fetchOptions: {
        onSuccess: () => {
          // Signup successful - email verification will be handled automatically
        },
        onError: (error) => {
          console.error("Signup error:", error);
          return { error: error.message || "Signup failed", success: false };
        },
      },
    });

    return {
      success: true,
      message:
        "Account created successfully. Please check your email for verification.",
    };
  } catch (error) {
    console.error("Signup error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
    };
  }
}
