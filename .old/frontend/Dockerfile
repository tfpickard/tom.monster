# syntax=docker/dockerfile:1
FROM node:18-alpine AS deps
WORKDIR /app
COPY frontend/package.json ./
RUN npm install --legacy-peer-deps

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ ./
RUN mkdir -p public
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/components ./components
COPY --from=builder /app/pages ./pages
COPY --from=builder /app/styles ./styles
EXPOSE 3000
CMD ["npm", "run", "start"]
