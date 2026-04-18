#!/usr/bin/env sh
set -eu

PRISMA_CONFIG_PATH="packages/db/prisma.config.ts"

echo "Generating Prisma client..."
bunx prisma generate --config "$PRISMA_CONFIG_PATH"

echo "Starting Prisma Studio..."
exec bunx prisma studio --port 5555 --browser none --config "$PRISMA_CONFIG_PATH"
