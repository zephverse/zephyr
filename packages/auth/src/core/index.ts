/** biome-ignore-all lint/performance/noBarrelFile: auth config */

export * from "./client";
export { type AuthConfig, createAuthConfig, type EmailService } from "./config";
export * from "./middleware";
export { hashPasswordWithScrypt, verifyPasswordWithScrypt } from "./password";
export * from "./types";
