import { debugLog } from "@zephyr/config/debug";
import { redis } from "@zephyr/db";
import { procedure, router } from "../trpc";

const LOGOUT_RATE_PREFIX = "rate:logout:";
const LOGOUT_RATE_WINDOW_SECONDS = 60 * 5;
const LOGOUT_MAX_PER_WINDOW = 10;
const LOGOUT_AUDIT_PREFIX = "audit:logout:";

async function checkLogoutRateLimit(
  userId: string,
  ip: string
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  const userKey = `${LOGOUT_RATE_PREFIX}user:${userId}`;
  const ipKey = `${LOGOUT_RATE_PREFIX}ip:${ip}`;

  const multi = (redis as unknown as { multi?: () => unknown }).multi?.();
  const pipe = multi as
    | {
        incr: (k: string) => void;
        expire: (k: string, s: number) => void;
        ttl: (k: string) => void;
        exec: () => Promise<[unknown, number][]>;
      }
    | null
    | undefined;

  if (pipe) {
    pipe.incr(userKey);
    pipe.expire(userKey, LOGOUT_RATE_WINDOW_SECONDS);
    pipe.incr(ipKey);
    pipe.expire(ipKey, LOGOUT_RATE_WINDOW_SECONDS);

    const results = (await pipe.exec()) as [unknown, number][] | null;
    const userCount = Number(results?.[0]?.[1] ?? 0);
    const ipCount = Number(results?.[2]?.[1] ?? 0);

    debugLog.api("logout:rate-check", { userId, ip, userCount, ipCount });

    if (userCount > LOGOUT_MAX_PER_WINDOW || ipCount > LOGOUT_MAX_PER_WINDOW) {
      return { ok: false, retryAfter: LOGOUT_RATE_WINDOW_SECONDS };
    }
  } else {
    const userCount = Number((await redis.incr(userKey)) || 0);
    await redis.expire(userKey, LOGOUT_RATE_WINDOW_SECONDS);
    const ipCount = Number((await redis.incr(ipKey)) || 0);
    await redis.expire(ipKey, LOGOUT_RATE_WINDOW_SECONDS);

    debugLog.api("logout:rate-check-fallback", {
      userId,
      ip,
      userCount,
      ipCount,
    });

    if (userCount > LOGOUT_MAX_PER_WINDOW || ipCount > LOGOUT_MAX_PER_WINDOW) {
      return { ok: false, retryAfter: LOGOUT_RATE_WINDOW_SECONDS };
    }
  }

  return { ok: true };
}

async function auditLogout(options: {
  userId: string;
  ip: string;
  userAgent: string | null;
  reason: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { userId, ip, userAgent, reason, metadata = {} } = options;
  const auditKey = `${LOGOUT_AUDIT_PREFIX}${userId}:${Date.now()}`;
  const auditData = {
    userId,
    ip,
    userAgent,
    reason,
    timestamp: new Date().toISOString(),
    ...metadata,
  };

  try {
    await redis.setex(auditKey, 60 * 60 * 24 * 30, JSON.stringify(auditData));
    debugLog.api("logout:audit", auditData);
  } catch (error) {
    console.error("Failed to audit logout:", error);
  }
}

export { checkLogoutRateLimit, auditLogout };

export const securityRouter = router({
  securityHealth: procedure.query(() => ({
    status: "healthy",
    timestamp: new Date().toISOString(),
    rateLimits: {
      logoutMaxPerWindow: LOGOUT_MAX_PER_WINDOW,
      logoutWindowSeconds: LOGOUT_RATE_WINDOW_SECONDS,
    },
  })),
});
