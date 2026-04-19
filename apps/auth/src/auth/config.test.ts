import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";

const mockSendVerificationOTP = mock(async () => ({ success: true }));
const mockSendVerificationEmail = mock(async () => ({
  success: true,
  verificationUrl: "url",
}));
const mockSendPasswordResetEmail = mock(async () => ({
  success: true,
  resetUrl: "url",
}));

mock.module("../email/service", () => ({
  sendVerificationOTP: mockSendVerificationOTP,
  sendVerificationEmail: mockSendVerificationEmail,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
}));

const mockCreateAuthConfig = mock((cfg: any) => cfg);

mock.module("@zephyr/auth", () => ({
  createAuthConfig: mockCreateAuthConfig,
}));

describe("auth config wrappers", () => {
  let auth: any;

  afterAll(() => {
    mock.restore();
  });

  beforeEach(async () => {
    // Need to set env before importing anything
    process.env.DATABASE_URL = "postgresql://mock";
    process.env.POSTGRES_PRISMA_URL = "postgresql://mock";
    process.env.POSTGRES_URL_NON_POOLING = "postgresql://mock";
    process.env.BETTER_AUTH_SECRET =
      "mock-secret-123456789012345678901234567890";
    process.env.RESEND_API_KEY = "test_key";

    const configModule = await import("./config");
    auth = configModule.auth;
  });

  test("exports configured auth object", () => {
    expect(auth).toBeDefined();
  });

  test("emailService methods wrap properly", async () => {
    const emailService = (auth as any).emailService;

    await emailService.sendVerificationEmail("test@example.com", "token123");
    expect(mockSendVerificationEmail).toHaveBeenCalledWith(
      "test@example.com",
      "token123"
    );

    await emailService.sendPasswordResetEmail("test@example.com", "token123");
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      "test@example.com",
      "token123"
    );
  });

  test("sendVerificationOTP wrapper success", async () => {
    const sendVerificationOTPWrapper = (auth as any).sendVerificationOTP;
    await sendVerificationOTPWrapper({
      email: "test@example.com",
      otp: "123",
      type: "email-verification",
    });
    expect(mockSendVerificationOTP).toHaveBeenCalledWith(
      "test@example.com",
      "123"
    );
  });

  test("sendVerificationOTP wrapper throws if result not success", async () => {
    mockSendVerificationOTP.mockResolvedValueOnce({
      success: false,
      error: "Failed",
    } as any);
    const sendVerificationOTPWrapper = (auth as any).sendVerificationOTP;
    await expect(
      sendVerificationOTPWrapper({
        email: "test@example.com",
        otp: "123",
        type: "email-verification",
      })
    ).rejects.toThrow("Failed");
  });

  test("sendVerificationOTP wrapper throws on unsupported type", async () => {
    const sendVerificationOTPWrapper = (auth as any).sendVerificationOTP;
    await expect(
      sendVerificationOTPWrapper({
        email: "test@example.com",
        otp: "123",
        type: "other",
      })
    ).rejects.toThrow("Unsupported verification type: other");
  });
});
