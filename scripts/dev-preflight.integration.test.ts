import { describe, expect, test } from "bun:test";
import {
  getMissingBuckets,
  getMissingServices,
  getUnhealthyServices,
  hasRedisPong,
  hasSchemaTables,
  type ServiceSnapshot,
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
