FROM oven/bun:latest AS base
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/ ./packages/
COPY apps/web/package.json ./apps/web/
RUN bun install
COPY apps/web/ ./apps/web/
WORKDIR /app/apps/web
RUN bun run build

FROM oven/bun:latest AS runtime
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/web ./apps/web
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["bun", "run", "start"]
