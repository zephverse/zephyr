"use client";

import type { LoginValues } from "@zephyr/auth/validation";
import { authClient } from "@/lib/auth";

const EMAIL_REGEX = /@/;

export async function login(values: LoginValues) {
  const isEmail = EMAIL_REGEX.test(values.username);
  try {
    if (isEmail) {
      await authClient.signIn.email({
        email: values.username,
        password: values.password,
        fetchOptions: {
          onError: () => {
            throw new Error("signin-failed");
          },
        },
      });
    } else {
      await authClient.signIn.username({
        username: values.username,
        password: values.password,
        fetchOptions: {
          onError: () => {
            throw new Error("signin-failed");
          },
        },
      });
    }
    return { success: true } as const;
  } catch {
    return {
      success: false,
      error: "Invalid username/email or password",
    } as const;
  }
}
