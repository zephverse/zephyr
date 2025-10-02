// Better Auth exports
// biome-ignore lint/performance/noBarrelFile: This is a small auth package with limited exports
export * from "./core";

// Email service exports (from previous restructuring)
export { sendPasswordResetEmail, sendVerificationEmail } from "./email/service";

// Validation exports
export { DISPOSABLE_EMAIL_DOMAINS } from "./validation/constants";
export {
  createPostSchema,
  type LoginValues,
  loginSchema,
  type SignUpValues,
  signUpSchema,
  type UpdateUserProfileValues,
  updateUserProfileSchema,
} from "./validation/schemas";
