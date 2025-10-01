// biome-ignore lint/performance/noBarrelFile: This is the internal package interface for auth/src
export {
  createBlankSessionCookie,
  createSessionCookie,
  lucia,
  validateRequest,
} from "./core/lucia";
// Email service exports (from previous restructuring)
export { sendPasswordResetEmail, sendVerificationEmail } from "./email/service";

// OAuth providers
export { discord, github, google, twitter } from "./providers/oauth";
export * from "./stream/services";
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
