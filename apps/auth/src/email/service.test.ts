import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

let throwOnSend = false;
let returnErrorOnSend = false;

mock.module("@zephyr/auth", () => ({
  validateEmailAdvanced: mock(async () => ({
    isValid: true,
    score: 100,
    confidence: "high",
    reasons: [],
    disposable: false,
  })),
}));

mock.module("resend", () => ({
  Resend: class MockResend {
    constructor(key: string) {
      if (key === "throw_init") {
        throw new Error("Init error");
      }
    }
    emails = {
      send: mock(async () => {
        await Promise.resolve();
        if (throwOnSend) {
          throw new Error("Send exception");
        }
        if (returnErrorOnSend) {
          return { error: { message: "Send error" } };
        }
        return { data: { id: "123" }, error: null };
      }),
    };
  },
}));

describe("email service", () => {
  let envModule: any;
  let serviceModule: any;

  beforeEach(async () => {
    throwOnSend = false;
    returnErrorOnSend = false;

    // We must manually set up the envs before importing
    process.env.RESEND_API_KEY = "test_key";
    Object.defineProperty(process.env, "NODE_ENV", {
      value: "development",
      writable: true,
    });
    process.env.NEXT_PUBLIC_URL = "https://social.localhost";
    process.env.DATABASE_URL = "postgresql://mock";
    process.env.POSTGRES_PRISMA_URL = "postgresql://mock";
    process.env.POSTGRES_URL_NON_POOLING = "postgresql://mock";
    process.env.BETTER_AUTH_SECRET =
      "mock-secret-123456789012345678901234567890";

    envModule = await import("../../env");
    // Ensure the runtime env overrides catch the manual sets
    Object.defineProperty(envModule.env, "RESEND_API_KEY", {
      value: "test_key",
      writable: true,
    });
    Object.defineProperty(envModule.env, "NODE_ENV", {
      value: "development",
      writable: true,
    });
    Object.defineProperty(envModule.env, "NEXT_PUBLIC_URL", {
      value: "https://social.localhost",
      writable: true,
    });

    serviceModule = await import("./service");
    serviceModule.__resetResend?.();
  });

  afterEach(() => {
    mock.restore();
  });

  test("validateEmailServiceConfig works", () => {
    envModule.env.RESEND_API_KEY = "test_key";
    expect(serviceModule.validateEmailServiceConfig().isValid).toBe(true);

    envModule.env.RESEND_API_KEY = "";
    expect(serviceModule.validateEmailServiceConfig().isValid).toBe(false);
  });

  test("isEmailServiceConfigured and isDevelopmentMode", () => {
    envModule.env.RESEND_API_KEY = "test_key";
    expect(serviceModule.isEmailServiceConfigured()).toBe(true);

    envModule.env.NODE_ENV = "development";
    expect(serviceModule.isDevelopmentMode()).toBe(true);
  });

  test("sendVerificationEmail sends successfully", async () => {
    envModule.env.RESEND_API_KEY = "test_key";
    const result = await serviceModule.sendVerificationEmail(
      "test@example.com",
      "token123"
    );
    expect(result.success).toBe(true);
  });

  test("sendVerificationEmail handles non-dev mode", async () => {
    envModule.env.RESEND_API_KEY = "test_key";
    envModule.env.NODE_ENV = "production";
    const result = await serviceModule.sendVerificationEmail(
      "test@example.com",
      "token123"
    );
    expect(result.success).toBe(true);
  });

  test("sendVerificationEmail returns error from resend", async () => {
    envModule.env.RESEND_API_KEY = "test_key";
    returnErrorOnSend = true;
    const result = await serviceModule.sendVerificationEmail(
      "test@example.com",
      "token123"
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Send error");
  });

  test("sendVerificationEmail catches exceptions", async () => {
    envModule.env.RESEND_API_KEY = "test_key";
    throwOnSend = true;
    const result = await serviceModule.sendVerificationEmail(
      "test@example.com",
      "token123"
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Send exception");
  });

  test("sendVerificationEmail catches validation error", async () => {
    const { validateEmailAdvanced: mockedValidate } = await import(
      "@zephyr/auth"
    );
    (mockedValidate as ReturnType<typeof mock>).mockResolvedValueOnce({
      isValid: false,
      score: 0,
      confidence: "low",
      reasons: ["Invalid format"],
      disposable: false,
    } as any);

    const result = await serviceModule.sendVerificationEmail(
      "bad@email",
      "token"
    );
    expect(result.success).toBe(false);
  });

  test("sendVerificationOTP sends successfully", async () => {
    envModule.env.RESEND_API_KEY = "test_key";
    const result = await serviceModule.sendVerificationOTP(
      "test@example.com",
      "123456"
    );
    expect(result.success).toBe(true);
  });

  test("sendVerificationOTP handles non-dev mode", async () => {
    envModule.env.RESEND_API_KEY = "test_key";
    envModule.env.NODE_ENV = "production";
    const result = await serviceModule.sendVerificationOTP(
      "test@example.com",
      "123456"
    );
    expect(result.success).toBe(true);
  });

  test("sendVerificationOTP returns error from resend", async () => {
    envModule.env.RESEND_API_KEY = "test_key";
    returnErrorOnSend = true;
    const result = await serviceModule.sendVerificationOTP(
      "test@example.com",
      "123456"
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Send error");
  });

  test("sendVerificationOTP catches exceptions", async () => {
    envModule.env.RESEND_API_KEY = "test_key";
    throwOnSend = true;
    const result = await serviceModule.sendVerificationOTP(
      "test@example.com",
      "123456"
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Send exception");
  });

  test("sendPasswordResetEmail sends successfully", async () => {
    envModule.env.RESEND_API_KEY = "test_key";
    const result = await serviceModule.sendPasswordResetEmail(
      "test@example.com",
      "token123"
    );
    expect(result.success).toBe(true);
  });

  test("sendPasswordResetEmail handles non-dev mode", async () => {
    envModule.env.RESEND_API_KEY = "test_key";
    envModule.env.NODE_ENV = "production";
    const result = await serviceModule.sendPasswordResetEmail(
      "test@example.com",
      "token123"
    );
    expect(result.success).toBe(true);
  });

  test("sendPasswordResetEmail returns error from resend", async () => {
    envModule.env.RESEND_API_KEY = "test_key";
    returnErrorOnSend = true;
    const result = await serviceModule.sendPasswordResetEmail(
      "test@example.com",
      "token123"
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Send error");
  });

  test("sendPasswordResetEmail catches exceptions", async () => {
    envModule.env.RESEND_API_KEY = "test_key";
    throwOnSend = true;
    const result = await serviceModule.sendPasswordResetEmail(
      "test@example.com",
      "token123"
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Send exception");
  });
});
