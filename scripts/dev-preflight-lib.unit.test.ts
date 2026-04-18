import { describe, expect, test } from "bun:test";
import {
  areInitJobsComplete,
  buildRuntimeFingerprint,
  computeCacheDigest,
  getMissingBuckets,
  getMissingServices,
  getUnhealthyServices,
  hasRedisPong,
  hasSchemaTables,
  type ServiceSnapshot,
  withinTtl,
} from "./dev-preflight-lib";

describe("service snapshot helpers", () => {
  test("detects missing required services", () => {
    const snapshots: ServiceSnapshot[] = [
      { Service: "postgres-dev", State: "running", Health: "healthy" },
      { Service: "redis-dev", State: "running", Health: "healthy" },
    ];

    const missing = getMissingServices(snapshots, [
      "postgres-dev",
      "redis-dev",
      "zephob-dev",
    ]);

    expect(missing).toEqual(["zephob-dev"]);
  });

  test("detects unhealthy services by state and health", () => {
    const snapshots: ServiceSnapshot[] = [
      { Service: "postgres-dev", State: "running", Health: "healthy" },
      { Service: "redis-dev", State: "running", Health: "unhealthy" },
      { Service: "meilisearch-dev", State: "exited", Health: "" },
    ];

    const unhealthy = getUnhealthyServices(snapshots, [
      "postgres-dev",
      "redis-dev",
      "meilisearch-dev",
    ]);

    expect(unhealthy).toEqual([
      "redis-dev (unhealthy)",
      "meilisearch-dev (exited)",
    ]);
  });
});

describe("output validators", () => {
  test("validates postgres schema probe output", () => {
    expect(hasSchemaTables("t\n")).toBe(true);
    expect(hasSchemaTables("f")).toBe(false);
  });

  test("validates redis ping output", () => {
    expect(hasRedisPong("PONG\n")).toBe(true);
    expect(hasRedisPong("ERR invalid password")).toBe(false);
  });

  test("finds missing buckets", () => {
    const missing = getMissingBuckets(
      ["uploads", "avatars"],
      ["uploads", "avatars", "temp", "backups"]
    );

    expect(missing).toEqual(["temp", "backups"]);
  });

  test("checks one-shot init completion", () => {
    expect(
      areInitJobsComplete(
        { exists: true, status: "Exited (0) 2 minutes ago" },
        { exists: true, status: "Exited (0) 1 minute ago" }
      )
    ).toBe(true);

    expect(
      areInitJobsComplete(
        { exists: false, status: "" },
        { exists: true, status: "Exited (0) 1 minute ago" }
      )
    ).toBe(false);
  });
});

describe("cache and fingerprint helpers", () => {
  test("keeps runtime fingerprint stable for equivalent snapshots", () => {
    const a: ServiceSnapshot[] = [
      { Service: "redis-dev", State: "running", Health: "healthy" },
      { Service: "postgres-dev", State: "running", Health: "healthy" },
    ];
    const b: ServiceSnapshot[] = [
      { Service: "postgres-dev", State: "running", Health: "healthy" },
      { Service: "redis-dev", State: "running", Health: "healthy" },
    ];

    expect(buildRuntimeFingerprint(a)).toBe(buildRuntimeFingerprint(b));
  });

  test("cache digest is deterministic", () => {
    expect(computeCacheDigest("same-input")).toBe(
      computeCacheDigest("same-input")
    );
    expect(computeCacheDigest("same-input")).not.toBe(
      computeCacheDigest("different-input")
    );
  });

  test("ttl helper identifies cache freshness", () => {
    const now = Date.now();
    expect(withinTtl(now - 500, 1000)).toBe(true);
    expect(withinTtl(now - 1500, 1000)).toBe(false);
  });
});
