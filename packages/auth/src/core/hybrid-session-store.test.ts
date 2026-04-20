import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const originalConsole = {
  error: console.error,
  log: console.log,
  warn: console.warn,
};

const mockPrisma = {
  session: {
    create: mock(async (args: any) => ({
      ...args.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as any,
    findUnique: mock(async () => null) as any,
    findMany: mock(async () => []) as any,
    update: mock(async (args: any) => ({
      id: args.where.id,
      ...args.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as any,
    deleteMany: mock(async () => {
      /* no-op */
    }) as any,
  },
};

const mockRedis = {
  pipeline: mock(() => ({
    setex: mock(),
    sadd: mock(),
    exec: mock(async () => []),
    del: mock(),
    srem: mock(),
  })) as any,
  get: mock(async () => null) as any,
  keys: mock(async () => []) as any,
  smembers: mock(async () => []) as any,
  del: mock(async () => {
    /* no-op */
  }) as any,
};

mock.module("@zephyr/db", () => ({
  prisma: mockPrisma,
  redis: mockRedis,
}));

import { HybridSessionStore } from "./hybrid-session-store";

describe("HybridSessionStore", () => {
  let store: HybridSessionStore;

  beforeEach(() => {
    console.error = mock(() => undefined) as typeof console.error;
    console.log = mock(() => undefined) as typeof console.log;
    console.warn = mock(() => undefined) as typeof console.warn;

    mockRedis.pipeline.mockClear();
    mockRedis.get.mockClear();
    mockRedis.keys.mockClear();
    mockRedis.smembers.mockClear();
    mockRedis.del.mockClear();

    mockPrisma.session.create.mockClear();
    mockPrisma.session.findUnique.mockClear();
    mockPrisma.session.findMany.mockClear();
    mockPrisma.session.update.mockClear();
    mockPrisma.session.deleteMany.mockClear();

    store = new HybridSessionStore();
  });

  afterEach(() => {
    console.error = originalConsole.error;
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    store.destroy();
    mock.restore();
  });

  test("create stores in redis and postgres", async () => {
    const session = await store.create({
      token: "test-token",
      userId: "user1",
      expiresAt: new Date(Date.now() + 10_000),
    });

    expect(session.id).toBeDefined();
    expect(mockRedis.pipeline).toHaveBeenCalled();
    expect(mockPrisma.session.create).toHaveBeenCalled();
  });

  test("create fallback to postgres if redis fails", async () => {
    mockRedis.pipeline.mockImplementationOnce(() => {
      throw new Error("Redis fail");
    });

    const session = await store.create({
      token: "test-token",
      userId: "user1",
      expiresAt: new Date(Date.now() + 10_000),
    });

    expect(session.id).toBeDefined();
    expect(mockPrisma.session.create).toHaveBeenCalled();
  });

  test("findByToken finds from redis", async () => {
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify({
        id: "s1",
        token: "test",
        userId: "u1",
        expiresAt: new Date(Date.now() + 10_000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );

    const result = await store.findByToken("test");
    expect(result?.id).toBe("s1");
    expect(mockPrisma.session.findUnique).not.toHaveBeenCalled();
  });

  test("findByToken deletes from redis if expired", async () => {
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify({
        id: "s1",
        token: "test",
        userId: "u1",
        expiresAt: new Date(Date.now() - 10_000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );

    // Must return the full pipeline mock including del and srem!
    mockRedis.pipeline.mockImplementationOnce(() => ({
      setex: mock(),
      sadd: mock(),
      del: mock(),
      srem: mock(),
      exec: mock(async () => []),
    }));
    // Second call to get in deleteFromRedis will fetch it again
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify({
        id: "s1",
        token: "test",
        userId: "u1",
        expiresAt: new Date(Date.now() - 10_000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );

    const result = await store.findByToken("test");
    expect(result).toBeNull();
    expect(mockRedis.pipeline).toHaveBeenCalled();
  });

  test("findByToken fallback to postgres if not in redis", async () => {
    // Return null from Redis
    mockRedis.get.mockResolvedValueOnce(null);
    mockPrisma.session.findUnique.mockResolvedValueOnce({
      id: "s1",
      token: "test",
      userId: "u1",
      expiresAt: new Date(Date.now() + 10_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await store.findByToken("test");
    expect(result?.id).toBe("s1");
    expect(mockPrisma.session.findUnique).toHaveBeenCalled();
    expect(mockRedis.pipeline).toHaveBeenCalled();
  });

  test("findByUserId gets from redis and postgres", async () => {
    mockRedis.smembers.mockResolvedValueOnce(["token1"]);
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify({
        id: "s1",
        token: "token1",
        userId: "u1",
        expiresAt: new Date(Date.now() + 10_000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );

    mockPrisma.session.findMany.mockResolvedValueOnce([
      {
        id: "s2",
        token: "token2",
        userId: "u1",
        expiresAt: new Date(Date.now() + 10_000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const results = await store.findByUserId("u1");
    expect(results.length).toBe(2);
    expect(results.map((r) => r.id)).toEqual(["s1", "s2"]);
  });

  test("update stores in redis and postgres", async () => {
    mockRedis.keys.mockResolvedValueOnce(["session:active:token1"]);
    // getFromRedis loop
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify({
        id: "s1",
        token: "token1",
        userId: "u1",
        expiresAt: new Date(Date.now() + 10_000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );

    const result = await store.update("s1", { ipAddress: "127.0.0.1" });
    expect(result?.ipAddress).toBe("127.0.0.1");
    expect(mockPrisma.session.update).toHaveBeenCalled();
  });

  test("update fallback to postgres if not in redis", async () => {
    mockRedis.keys.mockResolvedValueOnce([]); // Not in redis
    mockPrisma.session.update.mockResolvedValueOnce({
      id: "s1",
      token: "token1",
      userId: "u1",
      ipAddress: "127.0.0.1",
      expiresAt: new Date(Date.now() + 10_000),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await store.update("s1", { ipAddress: "127.0.0.1" });
    expect(result?.ipAddress).toBe("127.0.0.1");
    expect(mockPrisma.session.update).toHaveBeenCalled();
  });

  test("delete clears both stores", async () => {
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify({
        id: "s1",
        token: "token1",
        userId: "u1",
        expiresAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );

    await store.delete("token1");
    expect(mockRedis.pipeline).toHaveBeenCalled();
    expect(mockPrisma.session.deleteMany).toHaveBeenCalled();
  });

  test("deleteByUserId clears both stores", async () => {
    mockRedis.smembers.mockResolvedValueOnce(["token1"]);

    await store.deleteByUserId("u1");
    expect(mockRedis.pipeline).toHaveBeenCalled();
    expect(mockPrisma.session.deleteMany).toHaveBeenCalled();
  });

  test("syncExpiredSessions archives expired ones", async () => {
    mockRedis.keys.mockResolvedValueOnce(["session:active:token1"]);
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify({
        id: "s1",
        token: "token1",
        userId: "u1",
        expiresAt: new Date(Date.now() - 10_000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
    // Second get for deleteFromRedis
    mockRedis.get.mockResolvedValueOnce(
      JSON.stringify({
        id: "s1",
        token: "token1",
        userId: "u1",
        expiresAt: new Date(Date.now() - 10_000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );

    await (store as any).syncExpiredSessions();
    expect(mockPrisma.session.update).toHaveBeenCalled();
    expect(mockRedis.pipeline).toHaveBeenCalled();
  });
});
