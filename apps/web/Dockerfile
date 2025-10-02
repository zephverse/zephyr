FROM node:24-alpine AS base

ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1

ARG UNSEND_API_KEY

ENV UNSEND_API_KEY=$UNSEND_API_KEY

FROM base AS builder
RUN apk add --no-cache git
WORKDIR /app

RUN npm install -g bun turbo@latest && \
  turbo telemetry disable

COPY . .
RUN turbo prune --scope=@zephyr/web --docker

FROM base AS installer
RUN apk add --no-cache

WORKDIR /app

COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/bun.lock ./bun.lock
COPY --from=builder /app/turbo.json ./turbo.json
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma

RUN npm install -g bun turbo@latest && \
  turbo telemetry disable && \
  bun install --frozen-lockfile

RUN cd packages/db && bunx prisma generate

COPY --from=builder /app/out/full/ .

RUN NEXT_TELEMETRY_DISABLED=1 TURBO_TELEMETRY_DISABLED=1 bunx turbo build --filter=@zephyr/web... --force

FROM base AS runner
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs && \
  useradd --system --uid 1001 --gid nodejs nextjs

RUN mkdir -p /app/packages/db/prisma && \
  chown -R nextjs:nodejs /app

COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=installer --chown=nextjs:nodejs /app/packages/db/prisma ./packages/db/prisma

ENV PATH="/app/node_modules/.bin:${PATH}"
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TURBO_TELEMETRY_DISABLED=1
ENV UNSEND_API_KEY=$UNSEND_API_KEY

USER nextjs

CMD ["node", "apps/web/server.js"]
