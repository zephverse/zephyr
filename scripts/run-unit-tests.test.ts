import { describe, expect, mock, test } from "bun:test";
import { runUnitTests } from "./run-unit-tests";

describe("run-unit-tests", () => {
  test("fails when no unit tests exist", async () => {
    const logger = { error: mock(() => undefined) };

    const exitCode = await runUnitTests([], {
      collectFiles: async () => [],
      logger,
      runProcess: async () => 0,
      rootDir: "/tmp/repo",
    });

    expect(exitCode).toBe(1);
    expect(logger.error).toHaveBeenCalledWith("No unit tests found.");
  });

  test("runs unit test files in a single invocation", async () => {
    const invocations: string[][] = [];

    const exitCode = await runUnitTests(["--bail=1"], {
      collectFiles: async () => [
        "apps/auth/a.test.ts",
        "packages/db/b.test.ts",
        "scripts/c.test.ts",
      ],
      rootDir: "/tmp/repo",
      runProcess: ({ cmd }) => {
        invocations.push(cmd);
        return Promise.resolve(7);
      },
    });

    expect(exitCode).toBe(7);
    expect(invocations).toEqual([
      [
        "bun",
        "test",
        "--env-file=.env.test",
        "--bail=1",
        "./apps/auth/a.test.ts",
        "./packages/db/b.test.ts",
        "./scripts/c.test.ts",
      ],
    ]);
  });

  test("returns success when all unit files pass", async () => {
    const invocations: string[][] = [];

    const exitCode = await runUnitTests([], {
      collectFiles: async () => [
        "apps/auth/a.test.ts",
        "packages/db/b.test.ts",
      ],
      rootDir: "/tmp/repo",
      runProcess: ({ cmd, env, cwd }) => {
        invocations.push(cmd);
        expect(cwd).toBe("/tmp/repo");
        expect(env.NODE_ENV).toBe("test");
        return Promise.resolve(0);
      },
    });

    expect(exitCode).toBe(0);
    expect(invocations.length).toBe(1);
    expect(invocations[0]).toEqual([
      "bun",
      "test",
      "--env-file=.env.test",
      "./apps/auth/a.test.ts",
      "./packages/db/b.test.ts",
    ]);
  });
});
