import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { SignJWT } from "jose";

mock.module("@zephyr/db", () => ({
  jwtSessionCache: {
    createTokenHash: (t: string) => `hash_${t}`,
    setValidatedSession: mock(async () => {
      /* no-op */
    }) as any,
    getValidatedSession: mock(async () => null) as any,
    invalidateSession: mock(async () => {
      /* no-op */
    }) as any,
  },
  prisma: {},
  redis: {},
}));

import {
  cacheJWTValidation,
  createJWTValidationCacheKey,
  extractTokenFromHeader,
  getCachedJWTValidation,
  invalidateCachedJWT,
  validateJWTToken,
} from "./jwt";

describe("jwt helpers", () => {
  let secret: Uint8Array;
  let issuer: string;

  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    process.env.NEXT_PUBLIC_URL = "https://social.localhost";

    secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
    issuer = process.env.NEXT_PUBLIC_URL;
  });

  afterEach(() => {
    mock.restore();
  });

  describe("validateJWTToken", () => {
    test("returns valid true for good token", async () => {
      const token = await new SignJWT({ "urn:example:claim": true })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setIssuer(issuer)
        .setAudience(issuer)
        .setExpirationTime("2h")
        .sign(secret);

      const result = await validateJWTToken(token);
      expect(result.valid).toBe(true);
      expect(result.payload?.["urn:example:claim"]).toBe(true);
    });

    test("returns valid false for bad token", async () => {
      const result = await validateJWTToken("invalid.token.str");
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("extractTokenFromHeader", () => {
    test("extracts token when Bearer is present", () => {
      expect(extractTokenFromHeader("Bearer mytoken123")).toBe("mytoken123");
    });
    test("returns null when no Bearer", () => {
      expect(extractTokenFromHeader("mytoken123")).toBeNull();
      expect(extractTokenFromHeader(null)).toBeNull();
    });
  });

  describe("cache methods", () => {
    test("createJWTValidationCacheKey", () => {
      expect(createJWTValidationCacheKey("test")).toBe("hash_test");
    });

    test("cacheJWTValidation throws if no sub", async () => {
      await expect(cacheJWTValidation("test", {})).rejects.toThrow(
        "JWT payload missing sub claim"
      );
    });

    test("cacheJWTValidation stores session data", async () => {
      await cacheJWTValidation("test", {
        sub: "user123",
        email: "test@test.com",
        email_verified: true,
        exp: 12_345,
      });
    });

    test("getCachedJWTValidation calls getValidatedSession", async () => {
      await getCachedJWTValidation("test");
    });

    test("invalidateCachedJWT calls invalidateSession", async () => {
      await invalidateCachedJWT("test");
    });
  });
});
