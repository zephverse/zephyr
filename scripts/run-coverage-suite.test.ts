import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { runCoverageCli, runCoverageForScope } from "./run-coverage-suite";

const originalConsoleError = console.error;

describe("run-coverage-suite", () => {
  let sandbox = "";

  beforeEach(async () => {
    console.error = mock(() => undefined) as typeof console.error;
    sandbox = await mkdtemp(join(tmpdir(), "zephyr-run-coverage-suite-"));
    await mkdir(join(sandbox, "coverage", "all"), { recursive: true });
  });

  afterEach(async () => {
    console.error = originalConsoleError;
    if (sandbox) {
      await rm(sandbox, { force: true, recursive: true });
      sandbox = "";
    }
  });

  test("returns success for empty integration scope and writes placeholder lcov", async () => {
    const logger = { error: mock(() => undefined), log: mock(() => undefined) };

    const exitCode = await runCoverageForScope("integration", {
      collectFiles: async () => [],
      logger,
      removeFile: async () => undefined,
      runProcess: async () => 1,
      writeText: async (filePath) => {
        await mkdir(dirname(filePath), { recursive: true });
      },
    });

    expect(exitCode).toBe(0);
    expect(logger.log).toHaveBeenCalledWith(
      "No integration tests found. Skipping integration coverage."
    );
  });

  test("fails non-integration scopes with no tests", async () => {
    const logger = { error: mock(() => undefined), log: mock(() => undefined) };

    const exitCode = await runCoverageForScope("unit", {
      collectFiles: async () => [],
      logger,
      removeFile: async () => undefined,
      runProcess: async () => 0,
      writeText: async () => undefined,
    });

    expect(exitCode).toBe(1);
    expect(logger.error).toHaveBeenCalledWith("No tests found for unit scope.");
  });

  test("merges lcov chunks across files and returns success", async () => {
    const calls: string[][] = [];
    const removeCalls: string[] = [];
    const fakeLcov = new Map<string, string>([
      ["./apps/auth/src/a.test.ts", "TN:\nSF:a.ts\nDA:1,1\nend_of_record\n"],
      ["./scripts/b.test.ts", "TN:\nSF:b.ts\nDA:1,1\nend_of_record\n"],
    ]);
    let current = "";
    const writes = new Map<string, string>();

    const exitCode = await runCoverageForScope("unit", {
      collectFiles: async () => [
        "apps/auth/src/a.test.ts",
        "scripts/b.test.ts",
      ],
      fileExists: async (filePath) =>
        filePath.endsWith("coverage/all/lcov.info") &&
        Boolean(fakeLcov.get(current)),
      readText: async () => fakeLcov.get(current) ?? "",
      removeFile: (filePath) => {
        removeCalls.push(filePath);
        return Promise.resolve();
      },
      runProcess: (args) => {
        calls.push(args);
        current = args.at(-1) ?? "";
        return Promise.resolve(0);
      },
      writeText: (filePath, content) => {
        writes.set(filePath, content);
        return Promise.resolve();
      },
    });

    expect(exitCode).toBe(0);
    expect(removeCalls.length).toBe(2);
    expect(calls).toEqual([
      [
        "test",
        "--env-file=.env.test",
        "--coverage",
        "--coverage-reporter=text",
        "--coverage-reporter=lcov",
        "./apps/auth/src/a.test.ts",
      ],
      [
        "test",
        "--env-file=.env.test",
        "--coverage",
        "--coverage-reporter=text",
        "--coverage-reporter=lcov",
        "./scripts/b.test.ts",
      ],
    ]);

    const merged = writes.get("coverage/unit/lcov.info");
    expect(merged).toContain("SF:a.ts");
    expect(merged).toContain("SF:b.ts");
    expect(merged).toContain("FNF:0");
  });

  test("deduplicates lcov records by file and function", async () => {
    const writes = new Map<string, string>();
    let current = "";

    const chunksByFile = new Map<string, string>([
      [
        "./apps/auth/src/a.test.ts",
        [
          "TN:",
          "SF:apps/auth/src/a.ts",
          "FN:1,foo",
          "FNDA:0,foo",
          "DA:1,0",
          "DA:2,1",
          "end_of_record",
        ].join("\n"),
      ],
      [
        "./apps/auth/src/a2.test.ts",
        [
          "TN:",
          "SF:apps/auth/src/a.ts",
          "FN:1,foo",
          "FNDA:3,foo",
          "DA:1,3",
          "DA:2,0",
          "end_of_record",
        ].join("\n"),
      ],
    ]);

    const exitCode = await runCoverageForScope("unit", {
      collectFiles: async () => [
        "apps/auth/src/a.test.ts",
        "apps/auth/src/a2.test.ts",
      ],
      fileExists: async () => true,
      readText: async () => chunksByFile.get(current) ?? "",
      removeFile: async () => undefined,
      runProcess: (args) => {
        current = args.at(-1) ?? "";
        return Promise.resolve(0);
      },
      writeText: (filePath, content) => {
        writes.set(filePath, content);
        return Promise.resolve();
      },
    });

    expect(exitCode).toBe(0);
    const merged = writes.get("coverage/unit/lcov.info") ?? "";
    expect(merged).toContain("SF:apps/auth/src/a.ts");
    expect(merged).toContain("FNDA:3,foo");
    expect(merged).toContain("DA:1,3");
    expect(merged).toContain("DA:2,1");
    expect(merged).toContain("FNF:1");
    expect(merged).toContain("FNH:1");
    expect(merged).toContain("LF:2");
    expect(merged).toContain("LH:2");
  });

  test("writes partial lcov and returns failing exit code", async () => {
    const writes = new Map<string, string>();
    let current = "";

    const exitCode = await runCoverageForScope("unit", {
      collectFiles: async () => [
        "apps/auth/src/a.test.ts",
        "scripts/b.test.ts",
      ],
      fileExists: async () => true,
      readText: async () =>
        current.includes("a.test.ts")
          ? "TN:\nSF:a.ts\nDA:1,1\nend_of_record\n"
          : "TN:\nSF:b.ts\nDA:1,1\nend_of_record\n",
      removeFile: async () => undefined,
      runProcess: (args) => {
        current = args.at(-1) ?? "";
        return Promise.resolve(current.includes("b.test.ts") ? 3 : 0);
      },
      writeText: (filePath, content) => {
        writes.set(filePath, content);
        return Promise.resolve();
      },
    });

    expect(exitCode).toBe(3);
    const merged = writes.get("coverage/unit/lcov.info");
    expect(merged).toContain("SF:a.ts");
    expect(merged).toContain("SF:b.ts");
  });

  test("runCoverageCli validates arguments", async () => {
    const noArg = await runCoverageCli([]);
    const badArg = await runCoverageCli(["oops"]);

    expect(noArg).toBe(1);
    expect(badArg).toBe(1);
  });
});
