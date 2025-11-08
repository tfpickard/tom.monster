# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
RUN corepack enable && corepack prepare pnpm@9.8.0 --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

FROM deps AS builder
COPY . .
RUN pnpm build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["pnpm", "start"]
