#!/usr/bin/env sh
set -eu

PRISMA_CONFIG_PATH="packages/db/prisma.config.ts"

echo "Generating Prisma client..."
bunx prisma generate --config "$PRISMA_CONFIG_PATH"

echo "Pushing Prisma schema..."
bunx prisma db push --config "$PRISMA_CONFIG_PATH"

echo "Prisma bootstrap complete"
