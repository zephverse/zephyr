// biome-ignore lint/performance/noBarrelFile: This is a server-only validation package with limited exports
export {
  type EmailValidationOptions,
  type EmailValidationResult,
  validateEmailAdvanced,
  validateEmailBasic,
} from "./email-validator";
