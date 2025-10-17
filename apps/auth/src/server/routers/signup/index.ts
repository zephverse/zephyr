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
const RATE_PREFIX = "rate:signup:";
const RATE_GLOBAL_WINDOW_SECONDS = 60 * 15;
const RATE_GLOBAL_MAX_ATTEMPTS = 8;
const RATE_ACTION_WINDOW_SECONDS = 60 * 5;
const RATE_MAX_START_PER_WINDOW = 6;
const RATE_MAX_RESEND_PER_WINDOW = 3;
const RATE_CREATION_WINDOW_SECONDS = 60 * 60;
const RATE_MAX_CREATIONS_PER_WINDOW = 3;

async function verifyEmailOtp(
  emailLower: string,
  otp: string
): Promise<boolean> {
  const v = await prisma.verification.findFirst({
    where: {
      identifier: emailLower,
      value: otp,
    },
    select: { expiresAt: true },
  });

  if (!v?.expiresAt || v.expiresAt < new Date()) {
    return false;
  }

  return true;
}

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
  kind: "start" | "resend" | "verify" | "create",
  ip: string,
  emailLower: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Math.floor(Date.now() / 1000);
  const globalIpKey = `${RATE_PREFIX}global:ip:${ip}`;
  const globalEmailKey = `${RATE_PREFIX}global:email:${emailLower}`;
  const actionIpKey = `${RATE_PREFIX}${kind}:ip:${ip}`;
  const actionEmailKey = `${RATE_PREFIX}${kind}:email:${emailLower}`;

  try {
    const multi = redis.multi();
    multi.incr(globalIpKey);
    multi.expire(globalIpKey, RATE_GLOBAL_WINDOW_SECONDS);
    multi.incr(globalEmailKey);
    multi.expire(globalEmailKey, RATE_GLOBAL_WINDOW_SECONDS);
    multi.incr(actionIpKey);
    multi.expire(actionIpKey, RATE_ACTION_WINDOW_SECONDS);
    multi.incr(actionEmailKey);
    multi.expire(actionEmailKey, RATE_ACTION_WINDOW_SECONDS);
    multi.ttl(globalIpKey);

    const results = await multi.exec();

    if (!results) {
      debugLog.api("rate:redis-error", { kind, ip, emailLower });
      return { allowed: false, remaining: 0, resetTime: now + 60 };
    }

    const globalIpCount = Number(results[0]?.[1] ?? 0);
    const globalEmailCount = Number(results[2]?.[1] ?? 0);
    const actionIpCount = Number(results[4]?.[1] ?? 0);
    const actionEmailCount = Number(results[6]?.[1] ?? 0);
    const ttl = Number(results[8]?.[1] ?? RATE_GLOBAL_WINDOW_SECONDS);
    const globalIpAllowed = globalIpCount <= RATE_GLOBAL_MAX_ATTEMPTS;
    const globalEmailAllowed = globalEmailCount <= RATE_GLOBAL_MAX_ATTEMPTS;

    if (!(globalIpAllowed && globalEmailAllowed)) {
      const resetTime = now + ttl;
      debugLog.api(`rate:global-exceeded:${kind}`, {
        ip,
        emailLower,
        globalIpCount,
        globalEmailCount,
        resetTime,
      });
      return { allowed: false, remaining: 0, resetTime };
    }

    const actionMax =
      kind === "start" ? RATE_MAX_START_PER_WINDOW : RATE_MAX_RESEND_PER_WINDOW;
    const actionIpAllowed = actionIpCount <= actionMax;
    const actionEmailAllowed = actionEmailCount <= actionMax;

    if (!(actionIpAllowed && actionEmailAllowed)) {
      const resetTime = now + RATE_ACTION_WINDOW_SECONDS;
      debugLog.api(`rate:action-exceeded:${kind}`, {
        ip,
        emailLower,
        actionIpCount,
        actionEmailCount,
        resetTime,
      });
      return { allowed: false, remaining: 0, resetTime };
    }

    const globalRemaining = Math.max(
      0,
      RATE_GLOBAL_MAX_ATTEMPTS - Math.max(globalIpCount, globalEmailCount)
    );
    const actionRemaining = Math.max(
      0,
      actionMax - Math.max(actionIpCount, actionEmailCount)
    );
    const remaining = Math.min(globalRemaining, actionRemaining);

    debugLog.api(`rate:allowed:${kind}`, {
      ip,
      emailLower,
      globalIpCount,
      globalEmailCount,
      actionIpCount,
      actionEmailCount,
      remaining,
    });

    return { allowed: true, remaining, resetTime: now + ttl };
  } catch (error) {
    debugLog.api("rate:error", { kind, ip, emailLower, error: String(error) });
    return { allowed: false, remaining: 0, resetTime: now + 60 };
  }
}

async function checkAccountCreationRateLimit(
  ip: string,
  emailLower: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const now = Math.floor(Date.now() / 1000);

  const ipKey = `${RATE_PREFIX}creation:ip:${ip}`;
  const emailKey = `${RATE_PREFIX}creation:email:${emailLower}`;

  try {
    const multi = redis.multi();
    multi.incr(ipKey);
    multi.expire(ipKey, RATE_CREATION_WINDOW_SECONDS);
    multi.incr(emailKey);
    multi.expire(emailKey, RATE_CREATION_WINDOW_SECONDS);
    multi.ttl(ipKey);

    const results = await multi.exec();

    if (!results) {
      return { allowed: false, remaining: 0, resetTime: now + 60 };
    }

    const ipCount = Number(results[0]?.[1] ?? 0);
    const emailCount = Number(results[2]?.[1] ?? 0);
    const ttl = Number(results[4]?.[1] ?? RATE_CREATION_WINDOW_SECONDS);

    const ipAllowed = ipCount <= RATE_MAX_CREATIONS_PER_WINDOW;
    const emailAllowed = emailCount <= RATE_MAX_CREATIONS_PER_WINDOW;

    if (!(ipAllowed && emailAllowed)) {
      const resetTime = now + ttl;
      debugLog.api("rate:creation-exceeded", {
        ip,
        emailLower,
        ipCount,
        emailCount,
        resetTime,
      });
      return { allowed: false, remaining: 0, resetTime };
    }

    const remaining = Math.max(
      0,
      RATE_MAX_CREATIONS_PER_WINDOW - Math.max(ipCount, emailCount)
    );
    return { allowed: true, remaining, resetTime: now + ttl };
  } catch (error) {
    debugLog.api("rate:creation-error", {
      ip,
      emailLower,
      error: String(error),
    });
    return { allowed: false, remaining: 0, resetTime: now + 60 };
  }
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
        const rateCheck = await checkRateLimit(
          "start",
          ip,
          input.email.toLowerCase()
        );
        if (!rateCheck.allowed) {
          return {
            success: false,
            error: "rate-limited",
            remaining: rateCheck.remaining,
            resetTime: rateCheck.resetTime,
          } as const;
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
          displayName: input.displayName,
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
          debugLog.api("pendingSignupStart:otp-send-failed", {
            email: input.email,
            error:
              otpError instanceof Error ? otpError.message : String(otpError),
          });
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
      const rateCheck = await checkRateLimit(
        "resend",
        ip,
        input.email.toLowerCase()
      );
      if (!rateCheck.allowed) {
        return {
          success: false,
          error: "rate-limited",
          remaining: rateCheck.remaining,
          resetTime: rateCheck.resetTime,
        } as const;
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
    .mutation(async ({ input, ctx }) => {
      debugLog.api("pendingSignupSendLink:begin", { email: input.email });
      const emailLower = input.email.toLowerCase();

      const reqHeaders = ctx?.req?.headers as Headers | undefined;
      const ip = getClientIpFromHeaders(reqHeaders);
      const rateCheck = await checkRateLimit("resend", ip, emailLower);
      if (!rateCheck.allowed) {
        return {
          success: false,
          error: "rate-limited",
          remaining: rateCheck.remaining,
          resetTime: rateCheck.resetTime,
        } as const;
      }

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
    .mutation(async ({ input, ctx }) => {
      debugLog.api("pendingSignupVerify:begin");
      const ip = getClientIpFromHeaders(
        ctx?.req?.headers as Headers | undefined
      );

      if ("otpVerified" in input && input.email && input.otp) {
        debugLog.api("pendingSignupVerify:otp-verification-start");
        const emailLower = input.email.toLowerCase();
        const otpIsValid = await verifyEmailOtp(emailLower, input.otp);
        if (!otpIsValid) {
          return { success: false, error: "invalid-otp" } as const;
        }

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

          const creationRateCheck = await checkAccountCreationRateLimit(
            ip,
            pendingData.email.toLowerCase()
          );
          if (!creationRateCheck.allowed) {
            debugLog.api("pendingSignupVerify:creation-rate-limited", {
              email: pendingData.email,
              ip,
            });
            await redis.del(pendingKey);
            return {
              success: false,
              error: "rate-limited",
              remaining: creationRateCheck.remaining,
              resetTime: creationRateCheck.resetTime,
            } as const;
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
            const pendingEmailLower = pendingData.email.toLowerCase();
            const passwordObj = JSON.stringify({
              hash: pendingData.passwordHash,
            });

            await prisma.account.create({
              data: {
                userId: user.id,
                providerId: "email",
                accountId: pendingEmailLower,
                password: passwordObj,
              },
            });

            await prisma.account
              .create({
                data: {
                  userId: user.id,
                  providerId: "credential",
                  accountId: pendingEmailLower,
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

      const creationRateCheck = await checkAccountCreationRateLimit(
        ip,
        data.email.toLowerCase()
      );
      if (!creationRateCheck.allowed) {
        debugLog.api("pendingSignupVerify:creation-rate-limited", {
          email: data.email,
          ip,
        });
        await redis.del(key);
        return {
          success: false,
          error: "rate-limited",
          remaining: creationRateCheck.remaining,
          resetTime: creationRateCheck.resetTime,
        } as const;
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
