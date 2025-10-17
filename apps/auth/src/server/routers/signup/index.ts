import { randomUUID } from "node:crypto";
import { env } from "@root/env";
import { hashPasswordWithScrypt } from "@zephyr/auth/core";
import { debugLog } from "@zephyr/config/debug";
import { prisma, redis } from "@zephyr/db";
import { z } from "zod";
import { procedure, router } from "../../trpc";
import { emailRouter } from "../email";

const PENDING_PREFIX = "pending-signup:";
const PENDING_TTL_SECONDS = 60 * 60 * 2;
const RATE_PREFIX = "rate:pending:";
const RATE_WINDOW_SECONDS = 60 * 10;
const RATE_MAX_START_PER_WINDOW = 5;
const RATE_MAX_RESEND_PER_WINDOW = 3;

function getClientIpFromHeaders(headers: Headers | undefined): string {
  const forwarded = headers?.get?.("x-forwarded-for");
  if (!forwarded) {
    return "unknown";
  }
  const first = forwarded.split(",")[0]?.trim();
  return first || "unknown";
}

async function getPendingSignupData(input: {
  token?: string;
  email?: string;
  otp?: string;
  otpVerified?: boolean;
}): Promise<{ data: PendingSignup | null; key: string | null }> {
  if (!input.token) {
    return { data: null, key: null };
  }

  const key = `${PENDING_PREFIX}${input.token}`;
  const raw = await redis.get(key);
  debugLog.api("pendingSignupVerify:redis-get", { found: Boolean(raw) });
  if (!raw) {
    return { data: null, key: null };
  }

  try {
    const data = JSON.parse(raw) as PendingSignup;
    return { data, key };
  } catch {
    debugLog.api("pendingSignupVerify:parse-error");
    return { data: null, key: null };
  }
}

async function checkRateLimit(
  kind: "start" | "resend",
  ip: string,
  emailLower: string
): Promise<boolean> {
  const ipKey = `${RATE_PREFIX}${kind}:ip:${ip}`;
  const emailKeyRate = `${RATE_PREFIX}${kind}:email:${emailLower}`;
  const multi = (redis as unknown as { multi?: () => unknown }).multi?.();
  const pipe = multi as
    | {
        incr: (k: string) => void;
        expire: (k: string, s: number) => void;
        exec: () => Promise<[unknown, number][]>;
      }
    | null
    | undefined;
  if (pipe) {
    pipe.incr(ipKey);
    pipe.expire(ipKey, RATE_WINDOW_SECONDS);
    pipe.incr(emailKeyRate);
    pipe.expire(emailKeyRate, RATE_WINDOW_SECONDS);
    const results = (await pipe.exec()) as [unknown, number][] | null;
    const ipCount = Number(results?.[0]?.[1] ?? 0);
    const emailCount = Number(results?.[2]?.[1] ?? 0);
    debugLog.api(`rate:${kind}`, { ip, ipCount, emailCount });
    const max =
      kind === "start" ? RATE_MAX_START_PER_WINDOW : RATE_MAX_RESEND_PER_WINDOW;
    return ipCount <= max && emailCount <= max;
  }
  const ipCount = Number((await redis.incr(ipKey)) || 0);
  await redis.expire(ipKey, RATE_WINDOW_SECONDS);
  const emailCount = Number((await redis.incr(emailKeyRate)) || 0);
  await redis.expire(emailKeyRate, RATE_WINDOW_SECONDS);
  debugLog.api(`rate-fallback:${kind}`, { ip, ipCount, emailCount });
  const max =
    kind === "start" ? RATE_MAX_START_PER_WINDOW : RATE_MAX_RESEND_PER_WINDOW;
  return ipCount <= max && emailCount <= max;
}

async function doesUserExist(
  emailLower: string,
  username: string
): Promise<boolean> {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: emailLower, mode: "insensitive" } },
        { username: { equals: username, mode: "insensitive" } },
      ],
    },
    select: { id: true },
  });
  return Boolean(existing);
}

async function writePendingSignup(
  token: string,
  payload: PendingSignup
): Promise<void> {
  const key = `${PENDING_PREFIX}${token}`;
  const emailKey = `${PENDING_PREFIX}email:${payload.email.toLowerCase()}`;
  await redis.set(key, JSON.stringify(payload), "EX", PENDING_TTL_SECONDS);
  await redis.set(emailKey, token, "EX", PENDING_TTL_SECONDS);
  debugLog.api("pending:redis-set", {
    key,
    emailKey,
    ttl: PENDING_TTL_SECONDS,
  });
}

async function _sendVerificationEmailSafe(
  email: string,
  token: string
): Promise<void> {
  const base = env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
  const url = new URL(`${base}/verify-email`);
  url.searchParams.set("token", token);
  try {
    const { sendVerificationEmail } = await import("@/email/service");
    await sendVerificationEmail(email, token);
    debugLog.api("pending:email-sent");
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.log("Pending signup verification URL:", url.toString());
    }
    debugLog.api("pending:email-send-fallback", { url: url.toString() });
  }
}

type PendingSignup = {
  email: string;
  username: string;
  passwordHash: string;
  displayName: string;
  password: string;
};

export const signupRouter = router({
  pendingSignupStart: procedure
    .input(
      z.object({
        email: z.email(),
        username: z.string().min(3).max(32),
        password: z.string().min(8),
        displayName: z.string().min(1).max(64),
      })
    )
    .mutation(async ({ input, ctx }) => {
      debugLog.api("pendingSignupStart:begin", {
        email: input.email,
        username: input.username,
      });
      try {
        const ip = getClientIpFromHeaders(
          ctx?.req?.headers as Headers | undefined
        );
        const rateOk = await checkRateLimit(
          "start",
          ip,
          input.email.toLowerCase()
        );
        if (!rateOk) {
          return { success: false, error: "rate-limited" } as const;
        }

        const exists = await doesUserExist(input.email, input.username);
        debugLog.api("pendingSignupStart:existing", { exists });
        if (exists) {
          return { success: false, error: "user-exists" } as const;
        }

        const hashedPassword = await hashPasswordWithScrypt(input.password);
        debugLog.api("pendingSignupStart:hash-done");

        const token = randomUUID();
        const payload: PendingSignup = {
          email: input.email,
          username: input.username,
          passwordHash: hashedPassword,
          displayName: input.username,
          password: input.password,
        };

        await writePendingSignup(token, payload);

        try {
          const baseUrl = env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:3000";
          const response = await fetch(
            `${baseUrl}/api/auth/email-otp/send-verification-otp`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: input.email,
                type: "email-verification",
              }),
            }
          );

          if (!response.ok) {
            throw new Error(`OTP send failed: ${response.status}`);
          }

          debugLog.api("pendingSignupStart:otp-sent");
        } catch (otpError) {
          debugLog.api("pendingSignupStart:otp-error", {
            error:
              otpError instanceof Error ? otpError.message : String(otpError),
          });
          const { sendVerificationOTP } = await import(
            "../../../email/service"
          );
          await sendVerificationOTP(input.email, "123456");
          debugLog.api("pendingSignupStart:fallback-otp-sent");
        }

        debugLog.api("pendingSignupStart:done");
        return { success: true } as const;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        debugLog.api("pendingSignupStart:error", { message });
        console.error("pendingSignupStart:error", message);
        return { success: false, error: "server-error" } as const;
      }
    }),

  pendingSignupResend: procedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      debugLog.api("pendingSignupResend:begin", { email: input.email });
      const reqHeaders = ctx?.req?.headers as Headers | undefined;
      const ip = reqHeaders?.get?.("x-forwarded-for") || "unknown";
      const rateOk = await checkRateLimit(
        "resend",
        ip,
        input.email.toLowerCase()
      );
      if (!rateOk) {
        return { success: false, error: "rate-limited" } as const;
      }
      const emailKey = `${PENDING_PREFIX}email:${input.email.toLowerCase()}`;
      const token = await redis.get(emailKey);
      debugLog.api("pendingSignupResend:lookup", { found: Boolean(token) });
      if (!token) {
        return { success: false, error: "not-found" } as const;
      }
      try {
        const baseUrl = env.NEXT_PUBLIC_AUTH_URL ?? "http://localhost:3000";
        const response = await fetch(
          `${baseUrl}/api/auth/email-otp/send-verification-otp`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: input.email,
              type: "email-verification",
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`OTP send failed: ${response.status}`);
        }

        debugLog.api("pendingSignupResend:otp-sent");
      } catch (otpError) {
        debugLog.api("pendingSignupResend:otp-error", {
          error:
            otpError instanceof Error ? otpError.message : String(otpError),
        });
        try {
          const { sendVerificationEmail } = await import("@/email/service");
          await sendVerificationEmail(input.email, token);
          debugLog.api("pendingSignupResend:fallback-email-sent");
        } catch (emailError) {
          console.error("pendingSignupResend:email-error", emailError);
        }
      }
      return { success: true } as const;
    }),

  pendingSignupSendLink: procedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      debugLog.api("pendingSignupSendLink:begin", { email: input.email });
      const emailLower = input.email.toLowerCase();
      const emailKey = `${PENDING_PREFIX}email:${emailLower}`;
      const token = await redis.get(emailKey);
      if (!token) {
        return { success: false, error: "no-pending-signup" } as const;
      }
      try {
        await _sendVerificationEmailSafe(emailLower, token);
        debugLog.api("pendingSignupSendLink:sent");
        return { success: true } as const;
      } catch (e) {
        debugLog.api("pendingSignupSendLink:error", {
          message: e instanceof Error ? e.message : String(e),
        });
        return { success: false, error: "server-error" } as const;
      }
    }),

  pendingSignupVerify: procedure
    .input(
      z.union([
        z.object({ token: z.string().min(1) }),
        z.object({
          email: z.email(),
          otp: z.string().min(6),
          otpVerified: z.literal(true),
        }),
      ])
    )
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ignore
    .mutation(async ({ input }) => {
      debugLog.api("pendingSignupVerify:begin");

      if (
        "otpVerified" in input &&
        input.otpVerified &&
        input.email &&
        input.otp
      ) {
        debugLog.api("pendingSignupVerify:otp-verification-start");

        const emailKey = `${PENDING_PREFIX}email:${input.email.toLowerCase()}`;
        const token = await redis.get(emailKey);
        if (!token) {
          return { success: false, error: "no-pending-signup" } as const;
        }

        const pendingKey = `${PENDING_PREFIX}${token}`;
        const raw = await redis.get(pendingKey);
        if (!raw) {
          return { success: false, error: "no-pending-signup" } as const;
        }

        try {
          const pendingData = JSON.parse(raw) as PendingSignup;

          if (pendingData.email.toLowerCase() !== input.email.toLowerCase()) {
            debugLog.api("pendingSignupVerify:email-mismatch");
            return { success: false, error: "invalid-request" } as const;
          }

          const existing = await prisma.user.findFirst({
            where: {
              OR: [
                { email: { equals: pendingData.email, mode: "insensitive" } },
                {
                  username: {
                    equals: pendingData.username,
                    mode: "insensitive",
                  },
                },
              ],
            },
            select: { id: true },
          });
          debugLog.api("pendingSignupVerify:existing", {
            exists: Boolean(existing),
          });
          if (existing) {
            await redis.del(pendingKey);
            return { success: false, error: "user-exists" } as const;
          }

          try {
            await prisma.verification.deleteMany({
              where: {
                identifier: input.email.toLowerCase(),
              },
            });
            debugLog.api("pendingSignupVerify:otp-cleaned-up");
          } catch (cleanupError) {
            debugLog.api("pendingSignupVerify:otp-cleanup-failed", {
              error:
                cleanupError instanceof Error
                  ? cleanupError.message
                  : String(cleanupError),
            });
            // Don't fail if cleanup fails
          }

          const user = await prisma.user.create({
            data: {
              email: pendingData.email,
              username: pendingData.username,
              displayName: pendingData.displayName,
              displayUsername: pendingData.username,
              passwordHash: pendingData.passwordHash,
              emailVerified: true,
              emailVerifiedAt: new Date(),
              role: "user",
            },
            select: { id: true },
          });
          debugLog.api("pendingSignupVerify:user-created", { userId: user.id });

          try {
            const emailLower = pendingData.email.toLowerCase();
            const passwordObj = JSON.stringify({
              hash: pendingData.passwordHash,
            });

            await prisma.account.create({
              data: {
                userId: user.id,
                providerId: "email",
                accountId: emailLower,
                password: passwordObj,
              },
            });

            await prisma.account
              .create({
                data: {
                  userId: user.id,
                  providerId: "credential",
                  accountId: emailLower,
                  password: passwordObj,
                },
              })
              .catch(() => {
                /* ignore errors, account might already exist */
              });
            debugLog.api("pendingSignupVerify:account-created");
          } catch (e) {
            debugLog.api("pendingSignupVerify:account-create-error", {
              message: e instanceof Error ? e.message : String(e),
            });
          }

          await redis.del(pendingKey);
          debugLog.api("pendingSignupVerify:redis-del");

          return {
            success: true,
            userId: user.id,
            email: pendingData.email,
            password: pendingData.password,
          } as const;
        } catch {
          debugLog.api("pendingSignupVerify:parse-error");
          return { success: false, error: "no-pending-signup" } as const;
        }
      }

      const { data, key } = await getPendingSignupData(input);

      if (!(data && key)) {
        const errorType = "invalid-token";
        return { success: false, error: errorType } as const;
      }

      const existing = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: data.email, mode: "insensitive" } },
            { username: { equals: data.username, mode: "insensitive" } },
          ],
        },
        select: { id: true },
      });
      debugLog.api("pendingSignupVerify:existing", {
        exists: Boolean(existing),
      });
      if (existing) {
        await redis.del(key);
        return { success: false, error: "user-exists" } as const;
      }

      const user = await prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          displayName: data.displayName,
          displayUsername: data.username,
          passwordHash: data.passwordHash,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          role: "user",
        },
        select: { id: true },
      });
      debugLog.api("pendingSignupVerify:user-created", { userId: user.id });

      try {
        const emailLower = data.email.toLowerCase();
        const passwordObj = JSON.stringify({ hash: data.passwordHash });

        await prisma.account.create({
          data: {
            userId: user.id,
            providerId: "email",
            accountId: emailLower,
            password: passwordObj,
          },
        });

        await prisma.account
          .create({
            data: {
              userId: user.id,
              providerId: "credential",
              accountId: emailLower,
              password: passwordObj,
            },
          })
          .catch(() => {
            /* ignore errors, account might already exist */
          });
        debugLog.api("pendingSignupVerify:account-created");
      } catch (e) {
        debugLog.api("pendingSignupVerify:account-exists-or-error", {
          message: e instanceof Error ? e.message : String(e),
        });
      }

      await redis.del(key);
      debugLog.api("pendingSignupVerify:redis-del");
      return {
        success: true,
        userId: user.id,
        email: data.email,
        password: data.password,
      } as const;
    }),

  email: emailRouter,
});
