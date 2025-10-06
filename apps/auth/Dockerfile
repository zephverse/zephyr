FROM oven/bun:latest AS base
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/auth/package.json ./apps/auth/
RUN bun install
COPY apps/auth/ ./apps/auth/
WORKDIR /app/apps/auth
RUN bun run build

FROM oven/bun:latest AS runtime
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/auth ./apps/auth
WORKDIR /app/apps/auth
EXPOSE 3001
CMD ["bun", "run", "start"]
