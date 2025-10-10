#!/bin/sh
set -e
echo "Starting Zephyr Auth Service..."
echo "Initializing MeiliSearch user search index..."
cd /app/packages/db
if npx tsx scripts/init-meilisearch.ts; then
    echo "MeiliSearch initialization complete!"
else
    echo "Warning: MeiliSearch initialization failed, continuing with application startup..."
fi
cd /app/apps/auth
echo "Starting Next.js application..."
exec npx next start
