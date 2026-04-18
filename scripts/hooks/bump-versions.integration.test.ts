import { beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type PackageJson,
  runBumpVersionWithContext,
} from "./bump-versions-lib";

async function writePackageJson(path: string, pkg: PackageJson) {
  await writeFile(path, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function readVersion(path: string) {
  const content = await readFile(path, "utf8");
  return (JSON.parse(content) as PackageJson).version;
}

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
