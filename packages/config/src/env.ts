const isProduction = process.env.NODE_ENV === "production";
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const isTestEnvironment = process.env.NODE_ENV === "test";
const _skipValidation = process.env.NEXT_PUBLIC_SKIP_VALIDATION === "true";
const isDevelopment = !(isProduction || isBuildPhase || isTestEnvironment);

export function getEnvironmentMode() {
  return {
    isProduction,
    isDevelopment,
    isBuildPhase,
    isTestEnvironment,
  };
}
