"use server";

import { z } from "zod";
import { authClient } from "@/lib/auth";

const requestResetSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must include: uppercase & lowercase letters, number, and special character"
    ),
});

export async function requestPasswordReset(
  data: z.infer<typeof requestResetSchema>
) {
  try {
    const { email } = requestResetSchema.parse(data);

    await authClient.forgetPassword({
      email,
      fetchOptions: {
        onSuccess: () => {
          // Password reset email sent successfully
        },
        onError: (error) => {
          console.error("Password reset request error:", error);
          throw new Error("Failed to process password reset request");
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { error: "Failed to process password reset request" };
  }
}

export async function resetPassword(data: z.infer<typeof resetPasswordSchema>) {
  try {
    const { token, password } = resetPasswordSchema.parse(data);

    await authClient.resetPassword({
      token,
      newPassword: password,
      fetchOptions: {
        onSuccess: () => {
          // Password reset successfully
        },
        onError: (error) => {
          console.error("Password reset error:", error);
          throw new Error("Failed to reset password");
        },
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { error: "Failed to reset password" };
  }
}
