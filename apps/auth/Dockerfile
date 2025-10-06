FROM oven/bun:latest
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/ ./packages/
RUN bun install
COPY apps/auth/ ./apps/auth/
WORKDIR /app/apps/auth
RUN bun run build
EXPOSE 3001
CMD ["bun", "run", "start"]
