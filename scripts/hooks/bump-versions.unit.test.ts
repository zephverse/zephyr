import { describe, expect, test } from "bun:test";
import {
  bumpPatchVersion,
  determineChangedPackages,
  hasRootChanges,
} from "./bump-versions-lib";

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
