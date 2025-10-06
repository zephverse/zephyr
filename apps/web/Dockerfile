# Multi-stage build for Zephyr Web App
FROM oven/bun:latest AS base
WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/

# Install all dependencies
RUN bun install

# Copy source code
COPY apps/web/ ./apps/web/

# Build the web app
WORKDIR /app/apps/web
RUN bun run build

# Production stage
FROM oven/bun:latest AS runtime
WORKDIR /app

# Copy built app and node_modules
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/web ./apps/web

# Set working directory to web app
WORKDIR /app/apps/web

EXPOSE 3000
CMD ["bun", "run", "start"]
