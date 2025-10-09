import IoRedis, { type RedisOptions } from "ioredis";
import type { JSONWebKeySet } from "jose";
import { keys } from "../keys";

const createRedisConfig = (): RedisOptions => {
  const config: RedisOptions = {
    maxRetriesPerRequest: 2,
    connectTimeout: 5000,
    commandTimeout: 3000,
    retryStrategy(times: number) {
      const delay = Math.min(times * 50, 1000);
      return delay;
    },
    lazyConnect: true,
    enableReadyCheck: true,
    showFriendlyErrorStack: true,
    keepAlive: 10_000,
    autoResendUnfulfilledCommands: true,
    reconnectOnError: (err) => {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        return true;
      }
      return false;
    },
  };

  return config;
};

let redis: IoRedis;

try {
  redis = new IoRedis(keys.REDIS_URL, createRedisConfig());
} catch (error) {
  console.error("Failed to initialize Redis client:", error);
  throw error;
}

export { redis };

export type TrendingTopic = {
  hashtag: string;
  count: number;
};

const TRENDING_TOPICS_KEY = "trending:topics";
const TRENDING_TOPICS_BACKUP_KEY = "trending:topics:backup";
const CACHE_TTL = 3600;
const BACKUP_TTL = 86_400;

export const trendingTopicsCache = {
  async get(): Promise<TrendingTopic[]> {
    try {
      const topics = await redis.get(TRENDING_TOPICS_KEY);
      return topics ? JSON.parse(topics) : [];
    } catch (error) {
      console.error("Error getting trending topics from cache:", error);
      return this.getBackup();
    }
  },

  async getBackup(): Promise<TrendingTopic[]> {
    try {
      const backupTopics = await redis.get(TRENDING_TOPICS_BACKUP_KEY);
      return backupTopics ? JSON.parse(backupTopics) : [];
    } catch (error) {
      console.error("Error getting trending topics from backup cache:", error);
      return [];
    }
  },

  async set(topics: TrendingTopic[]): Promise<void> {
    try {
      const pipeline = redis.pipeline();

      pipeline.set(
        TRENDING_TOPICS_KEY,
        JSON.stringify(topics),
        "EX",
        CACHE_TTL
      );

      pipeline.set(
        TRENDING_TOPICS_BACKUP_KEY,
        JSON.stringify(topics),
        "EX",
        BACKUP_TTL
      );

      pipeline.set(
        `${TRENDING_TOPICS_KEY}:last_updated`,
        Date.now(),
        "EX",
        CACHE_TTL
      );

      await pipeline.exec();
    } catch (error) {
      console.error("Error setting trending topics cache:", error);
    }
  },

  async invalidate(): Promise<void> {
    try {
      const pipeline = redis.pipeline();
      pipeline.del(TRENDING_TOPICS_KEY);
      pipeline.del(`${TRENDING_TOPICS_KEY}:last_updated`);
      await pipeline.exec();
      console.log("Invalidated trending topics cache");
    } catch (error) {
      console.error("Error invalidating trending topics cache:", error);
    }
  },

  async shouldRefresh(): Promise<boolean> {
    try {
      const lastUpdated = await redis.get(
        `${TRENDING_TOPICS_KEY}:last_updated`
      );
      if (!lastUpdated) {
        return true;
      }
      const timeSinceUpdate = Date.now() - Number.parseInt(lastUpdated, 10);
      return timeSinceUpdate > (CACHE_TTL * 1000) / 2;
    } catch {
      return true;
    }
  },

  async warmCache(): Promise<void> {
    try {
      const shouldWarm = await this.shouldRefresh();
      if (!shouldWarm) {
        return;
      }
      await this.refreshCache();
    } catch (error) {
      console.error("Error warming trending topics cache:", error);
    }
  },

  refreshCache: null as unknown as () => Promise<TrendingTopic[]>,
};

export const POST_VIEWS_KEY_PREFIX = "post:views:";
export const POST_VIEWS_SET = "posts:with:views";
export const JWKS_CACHE_KEY = "jwks:cache";
export const SESSION_CACHE_KEY_PREFIX = "session:cache:";
export const JWKS_CACHE_TTL = 3600;
export const SESSION_CACHE_TTL = 300;

export const postViewsCache = {
  async incrementView(postId: string): Promise<number> {
    try {
      const pipeline = redis.pipeline();
      pipeline.sadd(POST_VIEWS_SET, postId);
      pipeline.incr(`${POST_VIEWS_KEY_PREFIX}${postId}`);
      const results = await pipeline.exec();

      const newCount = (results?.[1]?.[1] as number) || 0;
      console.log(`Redis: Incremented view for post ${postId} to ${newCount}`);

      return newCount;
    } catch (error) {
      console.error("Error incrementing post view:", error);
      return 0;
    }
  },

  async getViews(postId: string): Promise<number> {
    try {
      const views = await redis.get(`${POST_VIEWS_KEY_PREFIX}${postId}`);
      console.log(`Redis: Got views for post ${postId}: ${views}`);
      return Number.parseInt(views || "0", 10);
    } catch (error) {
      console.error("Error getting post views:", error);
      return 0;
    }
  },

  async getMultipleViews(postIds: string[]): Promise<Record<string, number>> {
    try {
      const pipeline = redis.pipeline();
      for (const id of postIds) {
        pipeline.get(`${POST_VIEWS_KEY_PREFIX}${id}`);
      }

      const results = await pipeline.exec();

      return postIds.reduce(
        (acc, id, index) => {
          acc[id] = Number.parseInt(
            (results?.[index]?.[1] as string) || "0",
            10
          );
          return acc;
        },
        {} as Record<string, number>
      );
    } catch (error) {
      console.error("Error getting multiple post views:", error);
      return {};
    }
  },

  async isInViewSet(postId: string): Promise<boolean> {
    try {
      return (await redis.sismember(POST_VIEWS_SET, postId)) === 1;
    } catch (error) {
      console.error("Error checking post in view set:", error);
      return false;
    }
  },
};

export type CachedSession = {
  session: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    username?: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

export const jwtSessionCache = {
  async setJWKS(jwks: JSONWebKeySet): Promise<void> {
    try {
      await redis.setex(JWKS_CACHE_KEY, JWKS_CACHE_TTL, JSON.stringify(jwks));
      console.log("Cached JWKS in Redis");
    } catch (error) {
      console.error("Error caching JWKS:", error);
    }
  },

  async getJWKS(): Promise<JSONWebKeySet | null> {
    try {
      const cached = await redis.get(JWKS_CACHE_KEY);
      if (cached) {
        console.log("Retrieved JWKS from cache");
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error("Error getting cached JWKS:", error);
      return null;
    }
  },

  async setValidatedSession(
    tokenHash: string,
    sessionData: CachedSession
  ): Promise<void> {
    try {
      await redis.setex(
        `${SESSION_CACHE_KEY_PREFIX}${tokenHash}`,
        SESSION_CACHE_TTL,
        JSON.stringify(sessionData)
      );
      console.log(
        `Cached validated session for token hash: ${tokenHash.substring(0, 8)}...`
      );
    } catch (error) {
      console.error("Error caching validated session:", error);
    }
  },

  async getValidatedSession(tokenHash: string): Promise<CachedSession | null> {
    try {
      const cached = await redis.get(`${SESSION_CACHE_KEY_PREFIX}${tokenHash}`);
      if (cached) {
        console.log(
          `Retrieved validated session from cache for token hash: ${tokenHash.substring(0, 8)}...`
        );
        const sessionData = JSON.parse(cached);
        sessionData.session.expiresAt = new Date(sessionData.session.expiresAt);
        sessionData.user.createdAt = new Date(sessionData.user.createdAt);
        sessionData.user.updatedAt = new Date(sessionData.user.updatedAt);
        return sessionData;
      }
      return null;
    } catch (error) {
      console.error("Error getting cached validated session:", error);
      return null;
    }
  },

  async invalidateSession(tokenHash: string): Promise<void> {
    try {
      await redis.del(`${SESSION_CACHE_KEY_PREFIX}${tokenHash}`);
      console.log(
        `Invalidated cached session for token hash: ${tokenHash.substring(0, 8)}...`
      );
    } catch (error) {
      console.error("Error invalidating cached session:", error);
    }
  },

  createTokenHash(token: string): string {
    const crypto = require("node:crypto");
    return crypto
      .createHash("sha256")
      .update(token)
      .digest("hex")
      .substring(0, 16);
  },
};
