# ─── Stage 1: Install dependencies ──────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
# ci installs exact versions from lockfile — reproducible builds
RUN npm ci --omit=dev

# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ─── Stage 3: Production runtime (minimal attack surface) ────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Non-root user — principle of least privilege
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only what's needed to run
COPY --from=deps   /app/node_modules ./node_modules
COPY --from=builder /app/dist        ./dist
COPY --from=builder /app/package.json ./package.json

# Prisma client requires the schema at runtime for migrations
COPY prisma ./prisma

USER appuser

ENV NODE_ENV=production \
    PORT=3001

EXPOSE 3001

# Healthcheck — Kubernetes liveness/readiness probes use this as a fallback
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/v1/health || exit 1

CMD ["node", "dist/main"]
