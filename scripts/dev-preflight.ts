#!/usr/bin/env bun

import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import process from "node:process";
import { intro, log, outro, spinner } from "@clack/prompts";
import {
  areInitJobsComplete,
  buildRuntimeFingerprint,
  type CacheShape,
  computeCacheDigest,
  DEFAULT_PREFLIGHT_CONFIG,
  getMissingBuckets,
  getMissingServices,
  getUnhealthyServices,
  hasRedisPong,
  hasSchemaTables,
  type OneShotStatus,
  type ServiceSnapshot,
  withinTtl,
} from "./dev-preflight-lib";

const CACHE_FILE = join(process.cwd(), ".cache", "dev-preflight.json");
const CACHE_TTL_MS = 20_000;
const CACHE_VERSION = 1;
const ZEPHOB_ACCESS_KEY = process.env.ZEPHOB_ROOT_USER ?? "zephob-admin";
const ZEPHOB_SECRET_KEY = process.env.ZEPHOB_ROOT_PASSWORD ?? "zephob-admin";
const ZEPHOB_REGION = process.env.ZEPHOB_REGION ?? "ap-south-1";
const ZEPHOB_INTERNAL_ENDPOINT = "http://zephob-dev:9000";

function fatal(message: string): never {
  log.error(message);
  outro("Preflight failed. Start infra with `bun run docker:dev` and retry.");
  process.exit(1);
}

async function runCmd(args: string[]) {
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

async function readJsonFile<T>(path: string, fallback: T): Promise<T> {
  try {
    const content = await readFile(path, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

async function ensureCacheDir() {
  await mkdir(dirname(CACHE_FILE), { recursive: true });
}

function getCache(): Promise<CacheShape> {
  return readJsonFile<CacheShape>(CACHE_FILE, {
    checks: {},
    version: CACHE_VERSION,
  });
}

async function setCache(cache: CacheShape) {
  await ensureCacheDir();
  await writeFile(CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`);
}

function hash(value: string) {
  return createHash("sha1").update(value).digest("hex");
}

async function withCache(
  cache: CacheShape,
  key: string,
  checkInput: string,
  fn: () => Promise<void>
) {
  const digest = computeCacheDigest(checkInput);
  const hit = cache.checks[key];

  if (hit && hit.key === digest && withinTtl(hit.timestamp, CACHE_TTL_MS)) {
    log.step(`${key}: cached`);
    return;
  }

  await fn();
  cache.checks[key] = {
    key: digest,
    timestamp: Date.now(),
  };
}

async function getServiceSnapshot() {
  const result = await runCmd([
    "docker",
    "compose",
    "-f",
    "docker/docker-compose.dev.yml",
    "ps",
    "--format",
    "json",
  ]);

  if (result.exitCode !== 0) {
    fatal(`Docker compose status failed: ${result.stderr || "unknown error"}`);
  }

  const lines = result.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const snapshots = lines.map((line) => JSON.parse(line) as ServiceSnapshot);
  return snapshots;
}

async function getOneShotStatus(containerName: string): Promise<OneShotStatus> {
  const result = await runCmd([
    "docker",
    "ps",
    "-a",
    "--filter",
    `name=${containerName}`,
    "--format",
    "{{.Status}}",
  ]);

  if (result.exitCode !== 0) {
    fatal(
      `Failed to inspect ${containerName} state: ${result.stderr || result.stdout}`
    );
  }

  if (!result.stdout) {
    return { exists: false, status: "" };
  }

  return {
    exists: true,
    status: result.stdout.split("\n")[0]?.trim() || "",
  };
}

function assertServicesHealthy(snapshots: ServiceSnapshot[]) {
  const missing = getMissingServices(
    snapshots,
    DEFAULT_PREFLIGHT_CONFIG.requiredServices
  );
  if (missing.length > 0) {
    fatal(`Missing required services: ${missing.join(", ")}`);
  }

  const unhealthy = getUnhealthyServices(
    snapshots,
    DEFAULT_PREFLIGHT_CONFIG.requiredServices
  );

  if (unhealthy.length > 0) {
    fatal(`Unhealthy services: ${unhealthy.join(", ")}`);
  }
}

async function assertPostgresSchemaReady() {
  const validate = await runCmd([
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

  if (validate.exitCode !== 0) {
    fatal(
      `Postgres schema check failed: ${validate.stderr || validate.stdout}`
    );
  }

  if (!hasSchemaTables(validate.stdout)) {
    fatal("Postgres schema is not initialized (no public tables found)");
  }
}

async function assertRedisReady() {
  const result = await runCmd([
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

  if (result.exitCode !== 0 || !hasRedisPong(result.stdout)) {
    fatal(
      `Redis check failed: ${result.stderr || result.stdout || "no response"}`
    );
  }
}

async function assertBucketsReady() {
  const list = await runCmd([
    "docker",
    "run",
    "--rm",
    "--network",
    "zephdev-network",
    "-e",
    `AWS_ACCESS_KEY_ID=${ZEPHOB_ACCESS_KEY}`,
    "-e",
    `AWS_SECRET_ACCESS_KEY=${ZEPHOB_SECRET_KEY}`,
    "-e",
    `AWS_DEFAULT_REGION=${ZEPHOB_REGION}`,
    "amazon/aws-cli:2.17.53",
    "s3api",
    "list-buckets",
    "--endpoint-url",
    ZEPHOB_INTERNAL_ENDPOINT,
    "--query",
    "Buckets[].Name",
    "--output",
    "json",
  ]);

  if (list.exitCode !== 0) {
    fatal(`Object storage check failed: ${list.stderr || list.stdout}`);
  }

  const bucketNames = JSON.parse(list.stdout) as string[];
  const missing = getMissingBuckets(
    bucketNames,
    DEFAULT_PREFLIGHT_CONFIG.requiredBuckets
  );

  if (missing.length > 0) {
    fatal(`Missing object storage buckets: ${missing.join(", ")}`);
  }
}

async function assertInitJobsCompleted() {
  const [schemaInit, objectInit] = await Promise.all([
    getOneShotStatus("zephdev-schema-init"),
    getOneShotStatus("zephdev-zephob-init"),
  ]);

  if (!areInitJobsComplete(schemaInit, objectInit)) {
    if (!schemaInit.exists) {
      fatal("Schema init job has not been created yet (zephdev-schema-init)");
    }
    if (!objectInit.exists) {
      fatal(
        "Object storage init job has not been created yet (zephdev-zephob-init)"
      );
    }
    if (!schemaInit.status.startsWith("Exited (0)")) {
      fatal(
        `Schema init job is not complete: ${schemaInit.status || "unknown"}`
      );
    }
    fatal(
      `Object storage init job is not complete: ${objectInit.status || "unknown"}`
    );
  }
}

async function assertMeilisearchReady() {
  const result = await runCmd([
    "curl",
    "-sS",
    "-f",
    "http://localhost:7700/health",
  ]);

  if (result.exitCode !== 0) {
    fatal(`Meilisearch check failed: ${result.stderr || result.stdout}`);
  }
}

async function getComposeFileFingerprint() {
  const composePath = join(process.cwd(), "docker", "docker-compose.dev.yml");
  const [content, fileStat] = await Promise.all([
    readFile(composePath, "utf8"),
    stat(composePath),
  ]);

  return hash(
    `${fileStat.mtimeMs}:${content.length}:${content.slice(0, 2048)}`
  );
}

async function run() {
  intro("zephdev preflight");

  const s = spinner();
  s.start("Collecting runtime status");
  const snapshots = await getServiceSnapshot();
  const composeFingerprint = await getComposeFileFingerprint();
  const runtimeFingerprint = buildRuntimeFingerprint(snapshots);
  s.stop("Runtime status collected");

  const cache = await getCache();
  if (cache.version !== CACHE_VERSION) {
    cache.version = CACHE_VERSION;
    cache.checks = {};
  }

  await withCache(
    cache,
    "services",
    `${composeFingerprint}:${runtimeFingerprint}`,
    () => {
      assertServicesHealthy(snapshots);
      log.success("services: running and healthy");
      return Promise.resolve();
    }
  );

  await withCache(
    cache,
    "init-jobs",
    `${composeFingerprint}:${runtimeFingerprint}`,
    async () => {
      const step = spinner();
      step.start("Checking one-shot init jobs");
      await assertInitJobsCompleted();
      step.stop("init jobs: completed");
    }
  );

  await withCache(
    cache,
    "postgres",
    `${composeFingerprint}:${runtimeFingerprint}`,
    async () => {
      const step = spinner();
      step.start("Checking postgres schema state");
      await assertPostgresSchemaReady();
      step.stop("postgres: schema ready");
    }
  );

  await withCache(
    cache,
    "redis",
    `${composeFingerprint}:${runtimeFingerprint}`,
    async () => {
      const step = spinner();
      step.start("Checking redis connectivity");
      await assertRedisReady();
      step.stop("redis: responsive");
    }
  );

  await withCache(
    cache,
    "zephob",
    `${composeFingerprint}:${runtimeFingerprint}:${ZEPHOB_ACCESS_KEY}:${ZEPHOB_REGION}`,
    async () => {
      const step = spinner();
      step.start("Checking object storage buckets");
      await assertBucketsReady();
      step.stop("object storage: buckets ready");
    }
  );

  await withCache(
    cache,
    "meilisearch",
    `${composeFingerprint}:${runtimeFingerprint}`,
    async () => {
      const step = spinner();
      step.start("Checking meilisearch health");
      await assertMeilisearchReady();
      step.stop("meilisearch: healthy");
    }
  );

  await setCache(cache);

  outro("Preflight checks passed");
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  fatal(message);
});
