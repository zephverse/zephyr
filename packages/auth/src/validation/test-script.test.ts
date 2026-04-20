import { describe, expect, test } from "bun:test";
import { signUpSchema } from "./schemas";

describe("signUpSchema sample validation", () => {
  test("accepts valid signup payload", () => {
    const result = signUpSchema.safeParse({
      email: "hello@example.com",
      username: "valid_user_123",
      password: "ValidPass2026!",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("hello@example.com");
      expect(result.data.username).toBe("valid_user_123");
    }
  });
});
