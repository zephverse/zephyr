import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  bumpPatchVersion,
  determineChangedPackages,
  hasRootChanges,
  type PackageJson,
  runBumpVersions,
  runBumpVersionWithContext,
} from "./bump-versions-lib";

async function writePackageJson(path: string, pkg: PackageJson) {
  await writeFile(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function readVersion(path: string) {
  const content = await readFile(path, "utf8");
  return (JSON.parse(content) as PackageJson).version;
}

describe("bumpPatchVersion", () => {
  test("increments patch version", () => {
    expect(bumpPatchVersion("1.2.3")).toBe("1.2.4");
  });

  test("rolls patch at 99", () => {
    expect(bumpPatchVersion("1.2.99")).toBe("1.3.0");
  });

  test("rolls middle at 99", () => {
    expect(bumpPatchVersion("1.99.99")).toBe("2.0.0");
  });

  test("throws on invalid version format", () => {
    expect(() => bumpPatchVersion("1.2")).toThrow(
      "Invalid version format: 1.2"
    );
    expect(() => bumpPatchVersion("abc")).toThrow(
      "Invalid version format: abc"
    );
  });
});

describe("determineChangedPackages", () => {
  test("collects unique app and package names", () => {
    const stagedFiles = [
      "packages/ui/src/button.tsx",
      "packages/ui/package.json",
      "packages/db/prisma/schema.prisma",
      "apps/web/src/app/page.tsx",
      "apps/auth/src/index.ts",
      "docker/docker-compose.dev.yml",
    ];

    const changed = determineChangedPackages(stagedFiles);

    expect([...changed].sort()).toEqual(["auth", "db", "ui", "web"]);
  });
});

describe("hasRootChanges", () => {
  test("returns false for apps and packages only", () => {
    expect(
      hasRootChanges(["apps/web/src/app/page.tsx", "packages/db/src/index.ts"])
    ).toBe(false);
  });

  test("returns true when root-level or infra files are staged", () => {
    expect(
      hasRootChanges([
        "apps/web/src/app/page.tsx",
        "docker/docker-compose.dev.yml",
      ])
    ).toBe(true);
  });
});

describe("runBumpVersionWithContext", () => {
  let sandboxDir = "";
  let stagedFiles = new Set<string>();
  let stagedByScript = new Set<string>();

  beforeEach(async () => {
    if (sandboxDir) {
      await rm(sandboxDir, { force: true, recursive: true });
    }

    sandboxDir = await mkdtemp(join(tmpdir(), "zephyr-bump-script-"));
    await mkdir(join(sandboxDir, "apps", "web"), { recursive: true });
    await mkdir(join(sandboxDir, "apps", "docs"), { recursive: true });
    await mkdir(join(sandboxDir, "packages", "db"), { recursive: true });

    await writePackageJson(join(sandboxDir, "package.json"), {
      name: "root",
      version: "1.0.1",
    });
    await writePackageJson(join(sandboxDir, "apps", "web", "package.json"), {
      name: "web",
      version: "1.0.1",
    });
    await writePackageJson(join(sandboxDir, "apps", "docs", "package.json"), {
      name: "docs",
      version: "0.0.1",
    });
    await writePackageJson(join(sandboxDir, "packages", "db", "package.json"), {
      name: "db",
      version: "1.0.1",
    });

    stagedFiles = new Set<string>();
    stagedByScript = new Set<string>();
  });

  test("skips missing workspace package.json files", async () => {
    stagedFiles = new Set(["apps/auth/src/index.ts"]);

    await runBumpVersionWithContext({
      fileExists: (pkgPath) => Bun.file(join(sandboxDir, pkgPath)).exists(),
      getStagedFiles: async () => [...stagedFiles],
      readPackageJson: async (pkgPath) =>
        JSON.parse(
          await readFile(join(sandboxDir, pkgPath), "utf8")
        ) as PackageJson,
      stageFile: (filePath) => {
        stagedByScript.add(filePath);
        return Promise.resolve();
      },
      writePackageJson: async (pkgPath, pkg) => {
        await writeFile(
          join(sandboxDir, pkgPath),
          `${JSON.stringify(pkg, null, 2)}\n`
        );
      },
    });

    expect(await readVersion(join(sandboxDir, "package.json"))).toBe("1.0.2");
    expect(stagedByScript.has("apps/auth/package.json")).toBe(false);
    expect(stagedByScript.has("package.json")).toBe(true);
  });

  test("bumps root and changed workspaces when files are staged", async () => {
    stagedFiles = new Set([
      "docker/docker-compose.dev.yml",
      "apps/web/src/app/page.tsx",
      "packages/db/src/index.ts",
    ]);

    await runBumpVersionWithContext({
      fileExists: (pkgPath) => {
        const path = join(sandboxDir, pkgPath);
        return Bun.file(path).exists();
      },
      getStagedFiles: async () => [...stagedFiles],
      readPackageJson: async (pkgPath) => {
        const content = await readFile(join(sandboxDir, pkgPath), "utf8");
        return JSON.parse(content) as PackageJson;
      },
      stageFile: (filePath) => {
        stagedByScript.add(filePath);
        return Promise.resolve();
      },
      writePackageJson: async (pkgPath, pkg) => {
        await writeFile(
          join(sandboxDir, pkgPath),
          `${JSON.stringify(pkg, null, 2)}\n`
        );
      },
    });

    expect(await readVersion(join(sandboxDir, "package.json"))).toBe("1.0.2");
    expect(
      await readVersion(join(sandboxDir, "apps", "web", "package.json"))
    ).toBe("1.0.2");
    expect(
      await readVersion(join(sandboxDir, "packages", "db", "package.json"))
    ).toBe("1.0.2");
    expect(
      await readVersion(join(sandboxDir, "apps", "docs", "package.json"))
    ).toBe("0.0.1");

    expect([...stagedByScript].sort()).toEqual([
      "apps/web/package.json",
      "package.json",
      "packages/db/package.json",
    ]);
  });

  test("does not bump anything when no staged files are present", async () => {
    await runBumpVersionWithContext({
      fileExists: (pkgPath) => Bun.file(join(sandboxDir, pkgPath)).exists(),
      getStagedFiles: async () => [],
      readPackageJson: async (pkgPath) =>
        JSON.parse(
          await readFile(join(sandboxDir, pkgPath), "utf8")
        ) as PackageJson,
      stageFile: (filePath) => {
        stagedByScript.add(filePath);
        return Promise.resolve();
      },
      writePackageJson: async (pkgPath, pkg) => {
        await writeFile(
          join(sandboxDir, pkgPath),
          `${JSON.stringify(pkg, null, 2)}\n`
        );
      },
    });

    expect(await readVersion(join(sandboxDir, "package.json"))).toBe("1.0.1");
    expect(stagedByScript.size).toBe(0);
  });
});

describe("runBumpVersions", () => {
  let originalSpawn: typeof Bun.spawn;
  let sandboxDir = "";

  beforeEach(async () => {
    originalSpawn = Bun.spawn;
    sandboxDir = await mkdtemp(join(tmpdir(), "zephyr-run-bump-versions-"));
    await writePackageJson(join(sandboxDir, "package.json"), {
      name: "root",
      version: "1.0.1",
    });
  });

  afterEach(async () => {
    Bun.spawn = originalSpawn;
    if (sandboxDir) {
      await rm(sandboxDir, { force: true, recursive: true });
    }
  });

  test("end-to-end bump versions with mocks", async () => {
    // We mock Bun.spawn to pretend git is working
    Bun.spawn = ((args: string[], _options: any) => {
      const command = args.join(" ");
      let stdoutStr = "";
      let exitCode = 0;

      if (command === "git rev-parse --show-toplevel") {
        stdoutStr = `${sandboxDir}\n`;
      } else if (command === "git diff --cached --name-only") {
        stdoutStr = "docker/docker-compose.dev.yml\n";
      } else if (command.startsWith("git add ")) {
        exitCode = 0;
      } else {
        exitCode = 1;
      }

      return {
        stdout: new Blob([stdoutStr]),
        stderr: new Blob([""]),
        exited: Promise.resolve(exitCode),
      } as any;
    }) as any;

    await runBumpVersions();

    expect(await readVersion(join(sandboxDir, "package.json"))).toBe("1.0.2");
  });

  test("throws if getGitRepoRoot fails", async () => {
    Bun.spawn = ((_args: string[], _options: any) =>
      ({
        stdout: new Blob([""]),
        stderr: new Blob(["fatal: not a git repository"]),
        exited: Promise.resolve(128),
      }) as any) as any;

    await expect(runBumpVersions()).rejects.toThrow(
      "Failed to resolve repository root"
    );
  });

  test("throws if getGitRepoRoot returns empty", async () => {
    Bun.spawn = ((_args: string[], _options: any) =>
      ({
        stdout: new Blob(["\n"]),
        stderr: new Blob([""]),
        exited: Promise.resolve(0),
      }) as any) as any;

    await expect(runBumpVersions()).rejects.toThrow(
      "Failed to resolve repository root path"
    );
  });

  test("throws if getStagedFiles fails", async () => {
    Bun.spawn = ((args: string[], _options: any) => {
      if (args[0] === "git" && args[1] === "rev-parse") {
        return {
          stdout: new Blob([`${sandboxDir}\n`]),
          stderr: new Blob([""]),
          exited: Promise.resolve(0),
        } as any;
      }
      return {
        stdout: new Blob([""]),
        stderr: new Blob(["error"]),
        exited: Promise.resolve(1),
      } as any;
    }) as any;

    await expect(runBumpVersions()).rejects.toThrow(
      "Failed to read staged files"
    );
  });

  test("throws if stageFile fails", async () => {
    Bun.spawn = ((args: string[], _options: any) => {
      if (args[0] === "git" && args[1] === "rev-parse") {
        return {
          stdout: new Blob([`${sandboxDir}\n`]),
          stderr: new Blob([""]),
          exited: Promise.resolve(0),
        } as any;
      }
      if (args[0] === "git" && args[1] === "diff") {
        return {
          stdout: new Blob(["docker/docker-compose.dev.yml\n"]),
          stderr: new Blob([""]),
          exited: Promise.resolve(0),
        } as any;
      }
      if (args[0] === "git" && args[1] === "add") {
        return {
          stdout: new Blob([""]),
          stderr: new Blob(["failed to add"]),
          exited: Promise.resolve(1),
        } as any;
      }
      return {
        stdout: new Blob([""]),
        stderr: new Blob([""]),
        exited: Promise.resolve(0),
      } as any;
    }) as any;

    await expect(runBumpVersions()).rejects.toThrow("Failed to stage");
  });
});

describe("bumpVersion error cases", () => {
  test("throws if version is missing", async () => {
    const sandboxDir = await mkdtemp(
      join(tmpdir(), "zephyr-bump-script-error-")
    );
    await writePackageJson(join(sandboxDir, "package.json"), {
      name: "root",
    } as any);

    await expect(
      runBumpVersionWithContext({
        fileExists: async () => true,
        getStagedFiles: async () => ["docker/docker-compose.dev.yml"],
        readPackageJson: async () => ({ name: "root" }) as any,
        stageFile: async () => {
          /* no-op */
        },
        writePackageJson: async () => {
          /* no-op */
        },
      })
    ).rejects.toThrow("Missing version in package.json");

    await rm(sandboxDir, { force: true, recursive: true });
  });
});
