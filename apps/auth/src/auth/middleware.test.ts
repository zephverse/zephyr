import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const mockFindUnique = mock(async () => null);

const mockFindByToken = mock(async () => null);
const mockCreate = mock(async () => null);
const mockValidateJWTToken = mock(async () => ({ valid: false }));

const mockGetSession = mock(async () => null);
const originalConsole = {
  error: console.error,
  log: console.log,
  warn: console.warn,
};

describe("middleware", () => {
  let middlewareModule: any;

  beforeEach(async () => {
    console.error = mock(() => undefined) as typeof console.error;
    console.log = mock(() => undefined) as typeof console.log;
    console.warn = mock(() => undefined) as typeof console.warn;

    mock.module("@zephyr/db", () => ({
      prisma: {
        user: {
          findUnique: mockFindUnique,
        },
      },
    }));

    mock.module("@zephyr/auth/core", () => ({
      extractTokenFromHeader: (h: string | null) =>
        h ? h.replace("Bearer ", "") : null,
      hybridSessionStore: {
        findByToken: mockFindByToken,
        create: mockCreate,
      },
      validateJWTToken: mockValidateJWTToken,
    }));

    mock.module("./config", () => ({
      auth: {
        api: {
          getSession: mockGetSession,
        },
      },
    }));

    process.env.DATABASE_URL = "postgresql://mock";
    process.env.POSTGRES_PRISMA_URL = "postgresql://mock";
    process.env.POSTGRES_URL_NON_POOLING = "postgresql://mock";
    process.env.BETTER_AUTH_SECRET =
      "mock-secret-123456789012345678901234567890";

    mockFindUnique.mockClear();
    mockFindByToken.mockClear();
    mockCreate.mockClear();
    mockValidateJWTToken.mockClear();
    mockGetSession.mockClear();

    middlewareModule = await import("./middleware");
  });

  afterEach(() => {
    console.error = originalConsole.error;
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    mock.clearAllMocks();
  });

  describe("getSessionFromRequest", () => {
    test("returns null if no header and no session", async () => {
      const req = new Request("http://localhost");
      const result = await middlewareModule.getSessionFromRequest(req);
      expect(result.session).toBeNull();
      expect(result.user).toBeNull();
      expect(mockGetSession).toHaveBeenCalled();
    });

    test("falls back to auth.api.getSession if header but invalid token", async () => {
      const req = new Request("http://localhost", {
        headers: { authorization: "Bearer invalid" },
      });
      const result = await middlewareModule.getSessionFromRequest(req);
      expect(mockFindByToken).toHaveBeenCalledWith("invalid");
      expect(mockValidateJWTToken).toHaveBeenCalledWith("invalid");
      expect(mockGetSession).toHaveBeenCalled();
      expect(result.session).toBeNull();
    });

    test("uses cached session from hybrid store", async () => {
      mockFindByToken.mockResolvedValueOnce({
        id: "s1",
        userId: "u1",
        token: "valid",
        expiresAt: new Date(),
        ipAddress: "127.0.0.1",
        userAgent: "ua",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      mockFindUnique.mockResolvedValueOnce({
        username: "test",
        email: "test@example.com",
        emailVerified: true,
        name: "Test",
        displayName: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const req = new Request("http://localhost", {
        headers: { authorization: "Bearer valid" },
      });
      const result = await middlewareModule.getSessionFromRequest(req);

      expect(mockFindByToken).toHaveBeenCalledWith("valid");
      expect(mockFindUnique).toHaveBeenCalled();
      expect(mockValidateJWTToken).not.toHaveBeenCalled();
      expect(mockGetSession).not.toHaveBeenCalled();
      expect(result.session?.id).toBe("s1");
      expect(result.user?.username).toBe("test");
    });

    test("returns null if cached session but user not found", async () => {
      mockFindByToken.mockResolvedValueOnce({
        id: "s1",
        userId: "u1",
        token: "valid",
        expiresAt: new Date(),
        ipAddress: "127.0.0.1",
        userAgent: "ua",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      mockFindUnique.mockResolvedValueOnce(null as any);

      const req = new Request("http://localhost", {
        headers: { authorization: "Bearer valid" },
      });
      const result = await middlewareModule.getSessionFromRequest(req);

      expect(result.session).toBeNull();
      expect(mockGetSession).toHaveBeenCalled();
    });

    test("creates new hybrid session if token is valid but uncached", async () => {
      mockFindByToken.mockResolvedValueOnce(null as any);
      mockValidateJWTToken.mockResolvedValueOnce({
        valid: true,
        payload: { sub: "u1", exp: Date.now() / 1000 + 10_000 },
      } as any);
      mockFindUnique.mockResolvedValueOnce({
        username: "test",
        email: "test@example.com",
        emailVerified: true,
        name: "Test",
        displayName: "Test User",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      mockCreate.mockResolvedValueOnce({
        id: "s1",
        userId: "u1",
        token: "valid",
        expiresAt: new Date(),
        ipAddress: "127.0.0.1",
        userAgent: "ua",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const req = new Request("http://localhost", {
        headers: { authorization: "Bearer valid" },
      });
      const result = await middlewareModule.getSessionFromRequest(req);

      expect(mockFindByToken).toHaveBeenCalledWith("valid");
      expect(mockValidateJWTToken).toHaveBeenCalledWith("valid");
      expect(mockFindUnique).toHaveBeenCalled();
      expect(mockCreate).toHaveBeenCalled();
      expect(result.session?.id).toBe("s1");
    });

    test("returns null if validation result has no sub", async () => {
      mockFindByToken.mockResolvedValueOnce(null as any);
      mockValidateJWTToken.mockResolvedValueOnce({
        valid: true,
        payload: { exp: Date.now() / 1000 + 10_000 },
      } as any);
      const req = new Request("http://localhost", {
        headers: { authorization: "Bearer valid" },
      });
      const result = await middlewareModule.getSessionFromRequest(req);

      expect(result.session).toBeNull();
      expect(result.user).toBeNull();
    });

    test("falls through if userData is null after validation", async () => {
      mockFindByToken.mockResolvedValueOnce(null as any);
      mockValidateJWTToken.mockResolvedValueOnce({
        valid: true,
        payload: { sub: "u1", exp: Date.now() / 1000 + 10_000 },
      } as any);
      mockFindUnique.mockResolvedValueOnce(null as any);

      // it should fall back to auth.api.getSession
      mockGetSession.mockResolvedValueOnce(null as any);

      const req = new Request("http://localhost", {
        headers: { authorization: "Bearer valid" },
      });
      const result = await middlewareModule.getSessionFromRequest(req);

      expect(result.session).toBeNull();
      expect(mockGetSession).toHaveBeenCalled();
    });

    test("uses auth.api.getSession as ultimate fallback and gets user data", async () => {
      mockGetSession.mockResolvedValueOnce({
        session: { id: "s2" },
        user: { id: "u2" },
      } as any);
      mockFindUnique.mockResolvedValueOnce({ username: "apiuser" } as any);

      const req = new Request("http://localhost");
      const result = await middlewareModule.getSessionFromRequest(req);

      expect(mockGetSession).toHaveBeenCalled();
      expect(mockFindUnique).toHaveBeenCalled();
      expect(result.session?.id).toBe("s2");
      expect(result.user?.username).toBe("apiuser");
    });

    test("catches errors and returns null", async () => {
      mockGetSession.mockImplementationOnce(() => {
        throw new Error("Oops");
      });
      const req = new Request("http://localhost");
      const result = await middlewareModule.getSessionFromRequest(req);

      expect(result.session).toBeNull();
      expect(result.user).toBeNull();
    });
  });

  describe("requireAuth and optionalAuth", () => {
    test("requireAuth throws if unauthorized", async () => {
      const req = new Request("http://localhost");
      await expect(middlewareModule.requireAuth(req)).rejects.toThrow(
        "Unauthorized"
      );
    });

    test("requireAuth returns context if authorized", async () => {
      mockGetSession.mockResolvedValueOnce({
        session: { id: "s2" },
        user: { id: "u2" },
      } as any);
      mockFindUnique.mockResolvedValueOnce({ username: "apiuser" } as any);

      const req = new Request("http://localhost");
      const result = await middlewareModule.requireAuth(req);

      expect(result.session?.id).toBe("s2");
    });

    test("optionalAuth acts like getSessionFromRequest", async () => {
      const req = new Request("http://localhost");
      const result = await middlewareModule.optionalAuth(req);
      expect(result.session).toBeNull();
    });
  });
});
