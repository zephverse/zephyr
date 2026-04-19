import { collectTestFiles } from "./test-file-discovery";

async function run(): Promise<number> {
  const rootDir = process.cwd();
  const extraArgs = Bun.argv.slice(2);
  const integrationTests = await collectTestFiles("integration", rootDir);

  if (integrationTests.length === 0) {
    console.log("No integration tests found. Skipping integration suite.");
    return 0;
  }

  const proc = Bun.spawn({
    cmd: [
      "bun",
      "test",
      "--env-file=.env.test",
      ...extraArgs,
      ...integrationTests.map((filePath) => `./${filePath}`),
    ],
    cwd: rootDir,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  return await proc.exited;
}

run()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error: unknown) => {
    console.error("Failed to execute integration tests:", error);
    process.exit(1);
  });
