"use server";

import { env } from "@root/env";

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
    const authBase = env.NEXT_PUBLIC_AUTH_URL;
    const res = await fetch(`${authBase}/api/trpc/pendingSignupStart`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        id: 1,
        json: {
          email: credentials.email,
          username: credentials.username,
          password: credentials.password,
          displayName: credentials.username,
        },
      }),
    });
    const data = await res.json().catch(() => ({}) as unknown);

    if (!res.ok) {
      const err = data?.message || data?.error || "HTTP request failed";
      return { success: false, error: String(err) };
    }

    const ok = data?.result?.data?.json?.success === true;
    if (!ok) {
      const err =
        data?.result?.error?.message ||
        data?.error?.message ||
        data?.result?.data?.json?.error ||
        data?.result?.data?.error ||
        data?.error ||
        "Signup failed";
      return { success: false, error: String(err) };
    }

    return {
      success: true,
      message:
        "Pending signup created. Please check your email to verify your address.",
      emailVerification: {
        email: credentials.email,
        isNewToken: true,
      },
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
    const authBase = env.NEXT_PUBLIC_AUTH_URL;
    const res = await fetch(`${authBase}/api/trpc/pendingSignupResend`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: 1, json: { email } }),
    });
    const data = await res.json().catch(() => ({}) as unknown);
    const ok = data?.result?.data?.success === true || data?.success === true;
    if (!ok) {
      const err =
        data?.error?.message ||
        data?.result?.error?.message ||
        data?.result?.data?.error ||
        data?.error ||
        "Failed to resend verification email";
      return { success: false, error: String(err) };
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

export async function verifyOTP(
  email: string,
  otp: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const authBase = env.NEXT_PUBLIC_AUTH_URL;
    const res = await fetch(`${authBase}/api/auth/email-otp/verify-email`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json().catch(() => ({}) as unknown);

    if (!res.ok) {
      const err = data?.message || data?.error || "OTP verification failed";
      return { success: false, error: String(err) };
    }

    const ok = data?.success === true;
    if (!ok) {
      const err = data?.message || data?.error || "Invalid OTP code";
      return { success: false, error: String(err) };
    }

    return { success: true };
  } catch (error) {
    console.error("OTP verification error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify OTP",
    };
  }
}

export async function sendVerificationLink(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const authBase = env.NEXT_PUBLIC_AUTH_URL;
    const res = await fetch(`${authBase}/api/trpc/pendingSignupSendLink`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: 1, json: { email } }),
    });
    const data = await res.json().catch(() => ({}) as unknown);
    const ok =
      data?.result?.data?.json?.success === true || data?.success === true;
    if (!ok) {
      const err =
        data?.result?.error?.message ||
        data?.result?.data?.json?.error ||
        data?.error ||
        "Failed to send verification link";
      return { success: false, error: String(err) };
    }
    return { success: true };
  } catch (error) {
    console.error("Send verification link error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send link",
    };
  }
}
