"use server";

import { env } from "@root/env";

const RATE_LIMIT_ERROR = "rate-limited";

function handleRateLimitError(
  data: unknown,
  userMessage: string
): {
  success: false;
  rateLimited: true;
  error: string;
  rateLimitInfo?: { remaining: number; resetTime: number };
} {
  const rateLimitInfo = (
    data as {
      result?: { data?: { json?: { remaining?: number; resetTime?: number } } };
    }
  )?.result?.data?.json;
  return {
    success: false,
    rateLimited: true,
    error: userMessage,
    rateLimitInfo: rateLimitInfo
      ? {
          remaining: rateLimitInfo.remaining || 0,
          resetTime: rateLimitInfo.resetTime || 0,
        }
      : undefined,
  };
}

type SignUpResponse = {
  error?: string;
  success: boolean;
  message?: string;
  emailVerification?: {
    email: string;
    isNewToken: boolean;
  };
  rateLimited?: boolean;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
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

      if (String(err) === RATE_LIMIT_ERROR) {
        return handleRateLimitError(
          data,
          "Whoa there, speed racer! You've hit the signup limit. Take a break and try again later."
        );
      }

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
  rateLimited?: boolean;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
  };
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

      if (String(err) === RATE_LIMIT_ERROR) {
        return handleRateLimitError(
          data,
          "Easy there, trigger finger! You've requested too many codes. Give it a moment and try again."
        );
      }

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
  rateLimited?: boolean;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
  };
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

      if (String(err) === RATE_LIMIT_ERROR) {
        const rateLimitInfo = (
          data as { json?: { remaining?: number; resetTime?: number } }
        )?.json;
        return {
          success: false,
          rateLimited: true,
          error: "Too many verification attempts. Please try again later.",
          rateLimitInfo: rateLimitInfo
            ? {
                remaining: rateLimitInfo.remaining || 0,
                resetTime: rateLimitInfo.resetTime || 0,
              }
            : { remaining: 0, resetTime: 0 },
        };
      }

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
  rateLimited?: boolean;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
  };
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

      if (String(err) === RATE_LIMIT_ERROR) {
        return handleRateLimitError(
          data,
          "Hold your horses! You've been clicking that button like it owes you money. Wait a moment before trying again."
        );
      }

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
