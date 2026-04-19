import { describe, expect, test } from "bun:test";
import {
  areInitJobsComplete,
  buildPreflightProgressLine,
  buildRuntimeFingerprint,
  computeCacheDigest,
  formatPreflightCheckState,
  getMissingBuckets,
  getMissingServices,
  getUnhealthyServices,
  hasRedisPong,
  hasSchemaTables,
  PREFLIGHT_CHECK_ORDER,
  type PreflightCheckKey,
  type PreflightCheckState,
  type ServiceSnapshot,
  shouldUseSudoForPortless,
  withinTtl,
} from "./dev-preflight-lib";

interface CmdResult {
  exitCode: number;
  stderr: string;
  stdout: string;
}

async function runCmd(args: string[]): Promise<CmdResult> {
  const proc = Bun.spawn(args, {
    stderr: "pipe",
    stdout: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  return {
    exitCode,
    stderr: stderr.trim(),
    stdout: stdout.trim(),
  };
}

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

describe("preflight ui helpers", () => {
  test("formats check states for compact status line", () => {
    expect(formatPreflightCheckState("pending")).toBe("wait");
    expect(formatPreflightCheckState("running")).toBe("...");
    expect(formatPreflightCheckState("ok")).toBe("ok");
    expect(formatPreflightCheckState("cached")).toBe("cache");
    expect(formatPreflightCheckState("failed")).toBe("fail");
  });

  test("builds compact single-line status output", () => {
    const states = new Map<PreflightCheckKey, PreflightCheckState>(
      PREFLIGHT_CHECK_ORDER.map((check) => [check.key, "pending"])
    );

    states.set("services", "ok");
    states.set("postgres", "running");
    states.set("portless", "cached");

    expect(buildPreflightProgressLine(states)).toBe(
      "preflight svc:ok init:wait pg:... rd:wait obj:wait mei:wait ptl:cache"
    );
  });
});

describe("portless start helpers", () => {
  test("detects sudo-required messages", () => {
    expect(shouldUseSudoForPortless("Error: Port 443 requires sudo.")).toBe(
      true
    );
    expect(shouldUseSudoForPortless("no TTY is available for sudo")).toBe(true);
    expect(
      shouldUseSudoForPortless(
        "sudo: a terminal is required to read the password"
      )
    ).toBe(true);
    expect(shouldUseSudoForPortless("Proxy started in background")).toBe(false);
  });
});

describe("dev preflight integration", () => {
  test("docker compose reports required services healthy", async () => {
    const ps = await runCmd([
      "docker",
      "compose",
      "-f",
      "docker/docker-compose.dev.yml",
      "ps",
      "--format",
      "json",
    ]);

    expect(ps.exitCode).toBe(0);

    const snapshots = ps.stdout
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line) as ServiceSnapshot);

    const required = [
      "postgres-dev",
      "redis-dev",
      "zephob-dev",
      "meilisearch-dev",
      "rabbitmq-dev",
      "timescaledb-dev",
    ];

    const missing = getMissingServices(snapshots, required);
    const unhealthy = getUnhealthyServices(snapshots, required);

    expect(missing).toEqual([]);
    expect(unhealthy).toEqual([]);
  });

  test("postgres has schema tables", async () => {
    const query = await runCmd([
      "docker",
      "compose",
      "-f",
      "docker/docker-compose.dev.yml",
      "exec",
      "-T",
      "postgres-dev",
      "psql",
      "-U",
      "postgres",
      "-d",
      "zephyr",
      "-At",
      "-c",
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE');",
    ]);

    expect(query.exitCode).toBe(0);
    expect(hasSchemaTables(query.stdout)).toBe(true);
  });

  test("redis responds to ping", async () => {
    const redis = await runCmd([
      "docker",
      "compose",
      "-f",
      "docker/docker-compose.dev.yml",
      "exec",
      "-T",
      "redis-dev",
      "redis-cli",
      "-a",
      "zephyrredis",
      "PING",
    ]);

    expect(redis.exitCode).toBe(0);
    expect(hasRedisPong(redis.stdout)).toBe(true);
  });

  test("object storage has required buckets", async () => {
    const buckets = await runCmd([
      "docker",
      "run",
      "--rm",
      "--network",
      "zephdev-network",
      "-e",
      "AWS_ACCESS_KEY_ID=zephob-admin",
      "-e",
      "AWS_SECRET_ACCESS_KEY=zephob-admin",
      "-e",
      "AWS_DEFAULT_REGION=ap-south-1",
      "amazon/aws-cli:2.17.53",
      "s3api",
      "list-buckets",
      "--endpoint-url",
      "http://zephob-dev:9000",
      "--query",
      "Buckets[].Name",
      "--output",
      "json",
    ]);

    expect(buckets.exitCode).toBe(0);

    const parsedBuckets = JSON.parse(buckets.stdout) as string[];
    const missing = getMissingBuckets(parsedBuckets, [
      "uploads",
      "avatars",
      "temp",
      "backups",
    ]);

    expect(missing).toEqual([]);
  });
});
