#!/usr/bin/env bun

import { join } from "node:path";

const packagesRegex = /^packages\/([^/]+)/;
const appsRegex = /^apps\/([^/]+)/;

interface PackageJson {
  version: string;
  [key: string]: unknown;
}

async function main() {
  const stagedFiles = await getStagedFiles();
  const changedPackages = determineChangedPackages(stagedFiles);
  const rootChanged = hasRootChanges(stagedFiles);

  if (changedPackages.size > 0 || rootChanged) {
    await bumpVersions(changedPackages);
  }
}

async function getStagedFiles(): Promise<string[]> {
  const proc = Bun.spawn(["git", "diff", "--cached", "--name-only"], {
    stdout: "pipe",
  });
  const output = await new Response(proc.stdout).text();
  await proc.exited;
  return output.split("\n").filter((line: string) => line.trim());
}

function determineChangedPackages(stagedFiles: string[]): Set<string> {
  const changedPackages = new Set<string>();
  for (const file of stagedFiles) {
    if (file.startsWith("packages/")) {
      const match = file.match(packagesRegex);
      if (match) {
        changedPackages.add(match[1]);
      }
    } else if (file.startsWith("apps/")) {
      const match = file.match(appsRegex);
      if (match) {
        changedPackages.add(match[1]);
      }
    }
  }
  return changedPackages;
}

function hasRootChanges(stagedFiles: string[]): boolean {
  return stagedFiles.some(
    (file: string) =>
      !(file.startsWith("packages/") || file.startsWith("apps/"))
  );
}

async function bumpVersions(changedPackages: Set<string>) {
  // Bump root version
  await bumpVersion("package.json");

  // Bump changed packages
  for (const pkg of changedPackages) {
    const pkgPath = join("packages", pkg, "package.json");
    try {
      await bumpVersion(pkgPath);
    } catch {
      // If package.json doesn't exist, skip
    }
    const appPath = join("apps", pkg, "package.json");
    try {
      await bumpVersion(appPath);
    } catch {
      // Skip
    }
  }
}

async function bumpVersion(pkgPath: string) {
  const file = Bun.file(pkgPath);
  const pkg: PackageJson = await file.json();
  const version = pkg.version;
  const parts = version.split(".").map(Number);
  if (parts.length !== 3) {
    throw new Error("Invalid version format");
  }

  let [major, middle, patch] = parts;
  patch++;
  if (patch > 99) {
    patch = 0;
    middle++;
    if (middle > 99) {
      middle = 0;
      major++;
    }
  }

  pkg.version = `${major}.${middle}.${patch}`;
  await Bun.write(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);

  // Stage the file
  const addProc = Bun.spawn(["git", "add", pkgPath]);
  await addProc.exited;
}

main();
