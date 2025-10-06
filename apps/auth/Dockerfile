# Multi-stage build for Zephyr Auth App
FROM oven/bun:latest AS base
WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/auth/package.json ./apps/auth/

# Install all dependencies
RUN bun install

# Copy source code
COPY apps/auth/ ./apps/auth/

# Build the auth app
WORKDIR /app/apps/auth
RUN bun run build

# Production stage
FROM oven/bun:latest AS runtime
WORKDIR /app

# Copy built app and node_modules
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/auth ./apps/auth

# Set working directory to auth app
WORKDIR /app/apps/auth

EXPOSE 3001
CMD ["bun", "run", "start"]
