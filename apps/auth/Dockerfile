FROM oven/bun:latest AS builder
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/auth/package.json ./apps/auth/
RUN bun install
COPY apps/auth/ ./apps/auth/
WORKDIR /app/apps/auth
RUN bun run build

FROM node:24-alpine AS runtime
RUN apk add --no-cache \
    openssl \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nextjs -u 1001
WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /app/apps/auth/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/auth/.next/static ./.next/static
USER nextjs
EXPOSE 3001
ENV PORT=3001
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/trpc/security.securityHealth || exit 1
CMD ["node", "server.js"]
