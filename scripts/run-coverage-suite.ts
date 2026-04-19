import { constants } from "node:fs";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { collectTestFiles, type TestScope } from "./test-file-discovery";

type CoverageScope = TestScope;

const SOURCE_LCOV_PATH = join("coverage", "all", "lcov.info");

function isCoverageScope(value: string): value is CoverageScope {
  return value === "all" || value === "unit" || value === "integration";
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function runBunCommand(args: string[]): Promise<number> {
  const proc = Bun.spawn({
    cmd: ["bun", "--config=scripts/bunfig.coverage.toml", ...args],
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "test",
    },
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  return proc.exited;
}

async function writeMergedLcov(
  scope: CoverageScope,
  chunks: string[]
): Promise<void> {
  const targetDir = join("coverage", scope);
  const targetPath = join(targetDir, "lcov.info");

  await mkdir(targetDir, { recursive: true });

  if (chunks.length === 0) {
    await writeFile(targetPath, "TN:\n", "utf8");
    return;
  }

  const merged = chunks
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .join("\n")
    .concat("\n");

  await writeFile(targetPath, merged, "utf8");
}

async function runCoverageForScope(scope: CoverageScope): Promise<number> {
  const coverageArgs = [
    "--coverage",
    "--coverage-reporter=text",
    "--coverage-reporter=lcov",
  ];

  const testFiles = await collectTestFiles(scope);

  if (testFiles.length === 0) {
    await writeMergedLcov(scope, []);

    if (scope === "integration") {
      console.log("No integration tests found. Skipping integration coverage.");
      return 0;
    }

    console.error(`No tests found for ${scope} scope.`);
    return 1;
  }

  const lcovChunks: string[] = [];

  for (const filePath of testFiles) {
    await rm(SOURCE_LCOV_PATH, { force: true });

    const exitCode = await runBunCommand([
      "test",
      "--env-file=.env.test",
      ...coverageArgs,
      `./${filePath}`,
    ]);

    const hasLcov = await fileExists(SOURCE_LCOV_PATH);
    if (hasLcov) {
      lcovChunks.push(await readFile(SOURCE_LCOV_PATH, "utf8"));
    }

    if (exitCode !== 0) {
      await writeMergedLcov(scope, lcovChunks);
      return exitCode;
    }
  }

  await writeMergedLcov(scope, lcovChunks);
  return 0;
}

async function run(): Promise<number> {
  const scopeInput = Bun.argv[2];

  const usage =
    "Usage: bun scripts/run-coverage-suite.ts <all|unit|integration>";
  if (scopeInput === undefined) {
    console.error(usage);
    return 1;
  }

  const scopeArg = scopeInput as CoverageScope;

  if (isCoverageScope(scopeArg) === false) {
    console.error(usage);
    return 1;
  }

  return await runCoverageForScope(scopeArg);
}

run()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error: unknown) => {
    console.error("Failed to run coverage suite:", error);
    process.exit(1);
  });
