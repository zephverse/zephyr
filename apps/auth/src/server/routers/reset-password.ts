import { prisma } from "@zephyr/db";
import { z } from "zod";
import { procedure, router } from "../trpc";
import { auditResetPassword, checkResetPasswordRateLimit } from "./security";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const requestResetSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const resetPasswordRouter = router({
  requestReset: procedure
    .input(requestResetSchema)
    .mutation(async ({ input }) => {
      const { identifier, ip = "unknown", userAgent = null } = input;

      try {
        const rateCheck = await checkResetPasswordRateLimit(identifier, ip);
        if (!rateCheck.ok) {
          await auditResetPassword({
            identifier,
            ip,
            userAgent,
            success: false,
            metadata: {
              reason: "rate-limited",
              retryAfter: rateCheck.retryAfter,
            },
          });

          return {
            success: false,
            error: "Too many reset attempts. Please try again later.",
            retryAfter: rateCheck.retryAfter,
          };
        }

        let user: {
          id: string;
          email: string | null;
          username: string;
        } | null = null;

        if (EMAIL_REGEX.test(identifier)) {
          user = await prisma.user.findUnique({
            where: { email: identifier },
            select: { id: true, email: true, username: true },
          });
        } else {
          user = await prisma.user.findUnique({
            where: { username: identifier },
            select: { id: true, email: true, username: true },
          });
        }

        if (!user) {
          await auditResetPassword({
            identifier,
            ip,
            userAgent,
            success: false,
            metadata: {
              reason: "user-not-found",
            },
          });

          return { success: true };
        }

        await auditResetPassword({
          identifier,
          ip,
          userAgent,
          success: true,
          userId: user.id,
          metadata: {
            foundBy: EMAIL_REGEX.test(identifier) ? "email" : "username",
          },
        });

        return { success: true };
      } catch (error) {
        console.error("Password reset request error:", error);

        await auditResetPassword({
          identifier,
          ip,
          userAgent,
          success: false,
          metadata: {
            error: error instanceof Error ? error.message : String(error),
          },
        }).catch(() => {
          // Ignore audit errors
        });

        return {
          success: false,
          error: "Failed to process password reset request",
        };
      }
    }),

  resetPassword: procedure
    .input(resetPasswordSchema)
    .mutation(async ({ input }) => {
      const { token, newPassword: _newPassword } = input;

      try {
        const verification = await prisma.verification.findFirst({
          where: {
            value: token,
            expiresAt: { gt: new Date() },
          },
          select: { id: true, userId: true },
        });

        if (!verification) {
          return {
            success: false,
            error: "Invalid or expired reset token",
          };
        }

        return { success: true };
      } catch (error) {
        console.error("Password reset error:", error);
        return {
          success: false,
          error: "Failed to reset password",
        };
      }
    }),
});
