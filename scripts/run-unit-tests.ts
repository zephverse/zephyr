import { collectTestFiles } from "./test-file-discovery";

async function run(): Promise<number> {
  const rootDir = process.cwd();
  const extraArgs = Bun.argv.slice(2);
  const unitTests = await collectTestFiles("unit", rootDir);

  if (unitTests.length === 0) {
    console.error("No unit tests found.");
    return 1;
  }

  for (const filePath of unitTests) {
    const proc = Bun.spawn({
      cmd: [
        "bun",
        "test",
        "--env-file=.env.test",
        ...extraArgs,
        `./${filePath}`,
      ],
      cwd: rootDir,
      env: {
        ...process.env,
        NODE_ENV: "test",
      },
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });

    const exitCode = await proc.exited;
    if (exitCode !== 0) {
      return exitCode;
    }
  }

  return 0;
}

run()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error: unknown) => {
    console.error("Failed to execute unit tests:", error);
    process.exit(1);
  });
