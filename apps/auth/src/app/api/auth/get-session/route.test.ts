import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockGetSession = mock(async () => null as any);
mock.module("../../../../auth/config", () => ({
  auth: {
    api: {
      getSession: mockGetSession,
    },
  },
}));

import { GET, OPTIONS } from "./route";

describe("GET /api/auth/get-session", () => {
  beforeEach(() => {
    mockGetSession.mockClear();
  });

  test("returns 200 and null session if unauthorized", async () => {
    mockGetSession.mockResolvedValueOnce(null as any);
    const req = new Request("http://localhost/api/auth/get-session") as any;
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeNull();
  });

  test("returns 200 and session if authorized", async () => {
    mockGetSession.mockResolvedValueOnce({
      session: { id: "s1" },
      user: { id: "u1", username: "testuser" },
    } as any);
    const req = new Request("http://localhost/api/auth/get-session") as any;
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.session.id).toBe("s1");
    expect(body.user.username).toBe("testuser");
  });

  test("handles OPTIONS preflight", () => {
    const res = OPTIONS();
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });
});
