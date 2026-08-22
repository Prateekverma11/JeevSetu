# ── Stage 1: Dependencies ──────────────────────────────────────────────────────
# CONCEPT: Containerization with Docker — multi-stage build for smaller image
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm ci --only=production

# ── Stage 2: Production Image ──────────────────────────────────────────────────
FROM node:20-alpine AS production

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY --chown=nodejs:nodejs . .

# Create uploads directory with correct permissions
RUN mkdir -p uploads && chown -R nodejs:nodejs uploads

# Switch to non-root user
USER nodejs

EXPOSE 5000

ENV NODE_ENV=production

# CONCEPT: Backend Deployment — production start command
CMD ["node", "server.js"]
