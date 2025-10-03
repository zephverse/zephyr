FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/ ./packages/
RUN bun install
COPY apps/web/ ./apps/web/
WORKDIR /app/apps/web
RUN bun run build
EXPOSE 3000
CMD ["bun", "run", "start"]
