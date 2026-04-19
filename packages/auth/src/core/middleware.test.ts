import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockAuth = {
  api: {
    getSession: mock(async () => null),
  },
};

mock.module("./config", () => ({ auth: mockAuth }));

import { getSessionFromRequest, optionalAuth, requireAuth } from "./middleware";

describe("middleware", () => {
  beforeEach(() => {
    mockAuth.api.getSession.mockClear();
  });

  test("getSessionFromRequest returns null when no session", async () => {
    const req = new Request("http://localhost", {
      headers: { Authorization: "Bearer 123" },
    });
    const result = await getSessionFromRequest(req);
    expect(result.session).toBeNull();
    expect(result.user).toBeNull();
    expect(mockAuth.api.getSession).toHaveBeenCalled();
  });

  test("getSessionFromRequest returns session and user", async () => {
    mockAuth.api.getSession.mockResolvedValueOnce({
      session: { id: "s1" } as any,
      user: { id: "u1" } as any,
    } as any);
    const req = new Request("http://localhost");
    const result = await getSessionFromRequest(req);
    expect(result.session?.id).toBe("s1");
    expect(result.user?.id).toBe("u1");
  });

  test("getSessionFromRequest catches error and returns null", async () => {
    mockAuth.api.getSession.mockImplementationOnce(() => {
      throw new Error("API fail");
    });
    const req = new Request("http://localhost");
    const result = await getSessionFromRequest(req);
    expect(result.session).toBeNull();
    expect(result.user).toBeNull();
  });

  test("requireAuth throws if unauthorized", async () => {
    mockAuth.api.getSession.mockResolvedValueOnce(null);
    const req = new Request("http://localhost");
    await expect(requireAuth(req)).rejects.toThrow("Unauthorized");
  });

  test("requireAuth returns context if authorized", async () => {
    mockAuth.api.getSession.mockResolvedValueOnce({
      session: { id: "s1" } as any,
      user: { id: "u1" } as any,
    } as any);
    const req = new Request("http://localhost");
    const result = await requireAuth(req);
    expect(result.session?.id).toBe("s1");
    expect(result.user?.id).toBe("u1");
  });

  test("optionalAuth works like getSessionFromRequest", async () => {
    mockAuth.api.getSession.mockResolvedValueOnce(null);
    const req = new Request("http://localhost");
    const result = await optionalAuth(req);
    expect(result.session).toBeNull();
  });
});
