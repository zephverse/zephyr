"use server";

import { authClient } from "@/lib/auth";

type SignUpResponse = {
  error?: string;
  success: boolean;
  message?: string;
  emailVerification?: {
    email: string;
    isNewToken: boolean;
  };
};

export async function signUp(credentials: {
  username: string;
  email: string;
  password: string;
}): Promise<SignUpResponse> {
  try {
    const result = await authClient.signUp.email({
      email: credentials.email,
      password: credentials.password,
      name: credentials.username,
      username: credentials.username,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message || "Signup failed",
      };
    }

    const requiresVerification = process.env.NODE_ENV === "production";

    if (requiresVerification) {
      return {
        success: true,
        message:
          "Account created successfully. Please check your email for verification.",
        emailVerification: {
          email: credentials.email,
          isNewToken: true,
        },
      };
    }

    return {
      success: true,
      message: "Account created successfully! Welcome aboard!",
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

export async function resendVerificationEmail(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const result = await authClient.sendVerificationEmail({
      email,
    });

    if (result.error) {
      return {
        success: false,
        error: result.error.message || "Failed to resend verification email",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Resend verification email error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to resend verification email",
    };
  }
}
