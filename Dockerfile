# syntax=docker/dockerfile:1.6

# ─── Stage 1: build ─────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install ALL deps (build needs vite, esbuild, drizzle-kit, types, etc.)
COPY package.json package-lock.json ./
RUN npm ci

# Copy sources and build
COPY . .
RUN npm run build

# Drop devDependencies for the runtime image.
RUN npm prune --omit=dev

# ─── Stage 2: runtime ───────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Non-root user for safety.
RUN addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/package.json ./package.json

USER app
EXPOSE 8080

# server/index.ts → bundled to dist/index.js by `npm run build`.
CMD ["node", "dist/index.js"]
