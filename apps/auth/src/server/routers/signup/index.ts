import { randomUUID } from "node:crypto";
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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: rate limit
async function applyRateLimit(
  kind: "start" | "resend",
  ip: string,
  emailLower: string
): Promise<{ ok: true } | { ok: false }> {
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
    if (ipCount > max || emailCount > max) {
      return { ok: false };
    }
  } else {
    const ipCount = Number((await redis.incr(ipKey)) || 0);
    await redis.expire(ipKey, RATE_WINDOW_SECONDS);
    const emailCount = Number((await redis.incr(emailKeyRate)) || 0);
    await redis.expire(emailKeyRate, RATE_WINDOW_SECONDS);
    debugLog.api(`rate-fallback:${kind}`, { ip, ipCount, emailCount });
    const max =
      kind === "start" ? RATE_MAX_START_PER_WINDOW : RATE_MAX_RESEND_PER_WINDOW;
    if (ipCount > max || emailCount > max) {
      return { ok: false };
    }
  }
  return { ok: true };
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

async function sendVerificationEmailSafe(
  email: string,
  token: string
): Promise<void> {
  const base = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
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
        const rate = await applyRateLimit(
          "start",
          ip,
          input.email.toLowerCase()
        );
        if (!rate.ok) {
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

        await sendVerificationEmailSafe(input.email, token);

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
      const ipKey = `${RATE_PREFIX}resend:ip:${String(ip).split(",")[0].trim()}`;
      const emailKeyRate = `${RATE_PREFIX}resend:email:${input.email.toLowerCase()}`;
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
        debugLog.api("pendingSignupResend:rate", {
          ip: String(ip),
          ipCount,
          emailCount,
        });
        if (
          ipCount > RATE_MAX_RESEND_PER_WINDOW ||
          emailCount > RATE_MAX_RESEND_PER_WINDOW
        ) {
          return { success: false, error: "rate-limited" } as const;
        }
      } else {
        const ipCount = Number((await redis.incr(ipKey)) || 0);
        await redis.expire(ipKey, RATE_WINDOW_SECONDS);
        const emailCount = Number((await redis.incr(emailKeyRate)) || 0);
        await redis.expire(emailKeyRate, RATE_WINDOW_SECONDS);
        debugLog.api("pendingSignupResend:rate-fallback", {
          ip: String(ip),
          ipCount,
          emailCount,
        });
        if (
          ipCount > RATE_MAX_RESEND_PER_WINDOW ||
          emailCount > RATE_MAX_RESEND_PER_WINDOW
        ) {
          return { success: false, error: "rate-limited" } as const;
        }
      }
      const emailKey = `${PENDING_PREFIX}email:${input.email.toLowerCase()}`;
      const token = await redis.get(emailKey);
      debugLog.api("pendingSignupResend:lookup", { found: Boolean(token) });
      if (!token) {
        return { success: false, error: "not-found" } as const;
      }
      try {
        const { sendVerificationEmail } = await import("@/email/service");
        await sendVerificationEmail(input.email, token);
        debugLog.api("pendingSignupResend:email-sent");
      } catch (err) {
        console.error("pendingSignupResend:email-error", err);
      }
      return { success: true } as const;
    }),

  pendingSignupVerify: procedure
    .input(z.object({ token: z.string().min(1) }))
    .mutation(async ({ input }) => {
      debugLog.api("pendingSignupVerify:begin");
      const key = `${PENDING_PREFIX}${input.token}`;
      const raw = await redis.get(key);
      debugLog.api("pendingSignupVerify:redis-get", { found: Boolean(raw) });
      if (!raw) {
        return { success: false, error: "invalid-token" } as const;
      }
      let data: PendingSignup | null = null;
      try {
        data = JSON.parse(raw) as PendingSignup;
      } catch (err) {
        console.error("pendingSignupVerify:parse-error", err);
        debugLog.api("pendingSignupVerify:parse-error");
        return { success: false, error: "invalid-token" } as const;
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
