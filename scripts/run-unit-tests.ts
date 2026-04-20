import { collectTestFiles } from "./test-file-discovery";

interface UnitTestRunnerDeps {
  collectFiles?: typeof collectTestFiles;
  logger?: Pick<typeof console, "error">;
  rootDir?: string;
  runProcess?: (options: {
    cmd: string[];
    cwd: string;
    env: Record<string, string | undefined>;
  }) => Promise<number>;
}

function defaultRunProcess(options: {
  cmd: string[];
  cwd: string;
  env: Record<string, string | undefined>;
}): Promise<number> {
  const proc = Bun.spawn({
    cmd: options.cmd,
    cwd: options.cwd,
    env: options.env,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  return proc.exited;
}

export async function runUnitTests(
  extraArgs = Bun.argv.slice(2),
  deps: UnitTestRunnerDeps = {}
): Promise<number> {
  const rootDir = deps.rootDir ?? process.cwd();
  const logger = deps.logger ?? console;
  const collectFiles = deps.collectFiles ?? collectTestFiles;
  const runProcess = deps.runProcess ?? defaultRunProcess;
  const unitTests = await collectFiles("unit", rootDir);

  if (unitTests.length === 0) {
    logger.error("No unit tests found.");
    return 1;
  }

  return await runProcess({
    cmd: [
      "bun",
      "test",
      "--env-file=.env.test",
      ...extraArgs,
      ...unitTests.map((filePath) => `./${filePath}`),
    ],
    cwd: rootDir,
    env: {
      ...process.env,
      NODE_ENV: "test",
    },
  });
}

// @ts-expect-error Bun supports import.meta.main at runtime in scripts
if (import.meta.main) {
  runUnitTests()
    .then((exitCode) => {
      process.exit(exitCode);
    })
    .catch((error: unknown) => {
      console.error("Failed to execute unit tests:", error);
      process.exit(1);
    });
}
