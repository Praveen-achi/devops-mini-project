# ==========================================
# Stage 1: Build & Production Dependencies
# ==========================================
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# ==========================================
# Stage 2: Hardened Production Runtime
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy cached dependencies and source files
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY src/ ./src/

# Security: run under non-root node user
USER node

# Container Healthcheck (Liveness probe)
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health/liveness || exit 1

EXPOSE 3000

CMD ["node", "src/server.js"]
