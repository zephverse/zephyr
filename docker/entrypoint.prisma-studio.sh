#!/bin/bash
set -e

bunx prisma generate --schema packages/db/prisma/schema.prisma
if bunx prisma db push --schema packages/db/prisma/schema.prisma; then
    echo "Database schema pushed successfully"
else
    echo "Warning: Database schema push failed, but continuing with Prisma Studio..."
fi

echo "Initializing MeiliSearch user search index..."
if node /app/docker/init-meilisearch.js; then
    echo "MeiliSearch initialization complete!"
else
    echo "Warning: MeiliSearch initialization failed, continuing with Prisma Studio..."
fi

exec bunx prisma studio --port 5555 --schema packages/db/prisma/schema.prisma
