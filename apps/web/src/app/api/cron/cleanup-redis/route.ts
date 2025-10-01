import { prisma, redis } from "@zephyr/db";
import { NextResponse } from "next/server";

async function cleanupPostViews(
  log: (message: string) => void,
  results: { deletedPostViews: number; processedKeys: number; errors: string[] }
): Promise<void> {
  const postIdsWithViews = await redis.smembers("posts:with:views");
  log(`Found ${postIdsWithViews.length} posts with views to check`);

  const batchSize = 100;
  for (let i = 0; i < postIdsWithViews.length; i += batchSize) {
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(postIdsWithViews.length / batchSize);

    try {
      const batch = postIdsWithViews.slice(i, i + batchSize);
      results.processedKeys += batch.length;

      const existingPosts = await prisma.post.findMany({
        where: { id: { in: batch } },
        select: { id: true },
      });

      const existingPostIds = new Set(existingPosts.map((p) => p.id));
      const pipeline = redis.pipeline();
      let batchDeletions = 0;

      for (const postId of batch) {
        if (!existingPostIds.has(postId)) {
          pipeline.srem("posts:with:views", postId);
          pipeline.del(`post:views:${postId}`);
          batchDeletions++;
        }
      }

      await pipeline.exec();
      results.deletedPostViews += batchDeletions;

      log(
        `✅ Batch ${batchNumber}/${totalBatches}: processed ${batch.length} posts, deleted ${batchDeletions} views`
      );
    } catch (error) {
      const errorMessage = `Error processing batch ${batchNumber}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
      log(`❌ ${errorMessage}`);
      results.errors.push(errorMessage);
    }
  }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Redis cleanup involves multiple data operations and error handling
async function cleanupTrendingTopics(
  log: (message: string) => void,
  results: { cleanedTrendingTopics: number; errors: string[] }
): Promise<void> {
  log("\nStarting trending topics cleanup...");
  try {
    const [currentTrendingTopics, backupTopics] = await Promise.all([
      redis.get("trending:topics"),
      redis.get("trending:topics:backup"),
    ]);

    let topics: Array<{ hashtag: string; [key: string]: unknown }> = [];
    if (currentTrendingTopics) {
      topics = JSON.parse(currentTrendingTopics);
      log(`Found ${topics.length} current trending topics`);
    } else if (backupTopics) {
      topics = JSON.parse(backupTopics);
      log(`Using ${topics.length} backup topics due to missing current topics`);
    } else {
      log("No trending topics found to clean");
    }

    if (topics.length > 0) {
      const validTopics: Array<{ hashtag: string; count: number }> = [];
      for (const topic of topics) {
        try {
          const postsWithHashtag = await prisma.post.count({
            where: {
              content: {
                contains: topic.hashtag,
                mode: "insensitive",
              },
            },
          });

          if (postsWithHashtag > 0) {
            validTopics.push({
              hashtag: topic.hashtag,
              count: postsWithHashtag,
            });
            log(
              `✅ Topic ${topic.hashtag} validated with ${postsWithHashtag} posts`
            );
          } else {
            results.cleanedTrendingTopics++;
            log(`🧹 Removed inactive topic: ${topic.hashtag}`);
          }
        } catch (error) {
          const errorMessage = `Failed to process topic ${topic.hashtag}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`;
          log(`❌ ${errorMessage}`);
          results.errors.push(errorMessage);
        }
      }

      if (results.cleanedTrendingTopics > 0) {
        const pipeline = redis.pipeline();
        pipeline.set(
          "trending:topics",
          JSON.stringify(validTopics),
          "EX",
          3600
        );
        pipeline.set(
          "trending:topics:backup",
          JSON.stringify(validTopics),
          "EX",
          86_400
        );
        await pipeline.exec();
        log(
          `✅ Updated trending topics cache with ${validTopics.length} valid topics`
        );
      }
    }
  } catch (error) {
    const errorMessage = `Trending topics cleanup error: ${
      error instanceof Error ? error.message : "Unknown error"
    }`;
    log(`❌ ${errorMessage}`);
    results.errors.push(errorMessage);
  }
}

async function cleanupExpiredKeys(
  log: (message: string) => void
): Promise<void> {
  log("\nStarting expired keys cleanup...");
  try {
    const keys = await redis.keys("*");
    let expiredKeys = 0;

    for (const key of keys) {
      try {
        const ttl = await redis.ttl(key);
        if (ttl === -2) {
          // Key doesn't exist
          continue;
        }
        if (ttl === -1) {
          // Key has no expiration
          continue;
        }
        if (ttl === 0) {
          // Key is expired
          await redis.del(key);
          expiredKeys++;
        }
      } catch (error) {
        log(
          `⚠️  Error checking TTL for key ${key}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    log(`🧹 Cleaned up ${expiredKeys} expired keys`);
  } catch (error) {
    log(
      `❌ Expired keys cleanup error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function cleanupUserSessions(
  log: (message: string) => void
): Promise<void> {
  log("\nStarting user sessions cleanup...");
  try {
    const sessionKeys = await redis.keys("session:*");
    let cleanedSessions = 0;

    for (const sessionKey of sessionKeys) {
      try {
        const sessionData = await redis.get(sessionKey);
        if (!sessionData) {
          await redis.del(sessionKey);
          cleanedSessions++;
          continue;
        }

        const session = JSON.parse(sessionData);
        const expiresAt = session.expiresAt || session.expires_at;

        if (expiresAt && new Date(expiresAt) < new Date()) {
          await redis.del(sessionKey);
          cleanedSessions++;
        }
      } catch (error) {
        log(
          `⚠️  Error processing session ${sessionKey}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    log(`🧹 Cleaned up ${cleanedSessions} expired sessions`);
  } catch (error) {
    log(
      `❌ User sessions cleanup error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function cleanupSearchCache(
  log: (message: string) => void
): Promise<void> {
  log("\nStarting search cache cleanup...");
  try {
    const searchKeys = await redis.keys("search:*");
    let cleanedSearchKeys = 0;

    for (const searchKey of searchKeys) {
      try {
        const ttl = await redis.ttl(searchKey);
        if (ttl > 0 && ttl < 300) {
          // Keep short-lived cache
          continue;
        }

        const lastAccessed = await redis.object("IDLETIME", searchKey);
        if (lastAccessed && lastAccessed > 3600) {
          // Remove if not accessed for more than 1 hour
          await redis.del(searchKey);
          cleanedSearchKeys++;
        }
      } catch (error) {
        log(
          `⚠️  Error processing search key ${searchKey}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    log(`🧹 Cleaned up ${cleanedSearchKeys} stale search cache entries`);
  } catch (error) {
    log(
      `❌ Search cache cleanup error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function cleanupRedisCache() {
  const logs: string[] = [];
  const startTime = Date.now();

  const log = (message: string) => {
    console.log(message);
    logs.push(message);
  };

  const results = {
    deletedPostViews: 0,
    cleanedTrendingTopics: 0,
    processedKeys: 0,
    errors: [] as string[],
  };

  try {
    try {
      await redis.ping();
      log("✅ Redis connection successful");
    } catch (error) {
      log("❌ Redis connection failed");
      console.error("Redis connection error:", error);
      return { success: false, logs, error: "Redis connection failed" };
    }

    log("Starting Redis cache cleanup...");

    // Clean up different types of cache
    await cleanupPostViews(log, results);
    await cleanupTrendingTopics(log, results);
    await cleanupExpiredKeys(log);
    await cleanupUserSessions(log);
    await cleanupSearchCache(log);

    const summary = {
      success: true,
      duration: Date.now() - startTime,
      ...results,
      logs,
      timestamp: new Date().toISOString(),
    };

    log("\n✅ Cache cleanup completed successfully");
    log(`📊 Summary:
    - Duration: ${summary.duration}ms
    - Deleted Views: ${summary.deletedPostViews}
    - Cleaned Topics: ${summary.cleanedTrendingTopics}
    - Processed Keys: ${summary.processedKeys}
    - Errors: ${summary.errors.length}`);

    return summary;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    log(`❌ Fatal error during cleanup: ${errorMessage}`);
    console.error(
      "Cleanup error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );

    return {
      success: false,
      duration: Date.now() - startTime,
      ...results,
      logs,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  } finally {
    try {
      await prisma.$disconnect();
      log("✅ Database connection closed");
    } catch (_error) {
      log("❌ Error closing database connection");
    }
  }
}

export async function GET() {
  try {
    const result = await cleanupRedisCache();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Route handler error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
