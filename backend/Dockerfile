# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies (needed for bcrypt, etc.)
RUN apk add --no-cache python3 make g++

COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN yarn build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install runtime dependencies (OpenSSL is required for Prisma)
RUN apk add --no-cache openssl libc6-compat

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Copy only necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Switch to non-root user
USER nodejs

EXPOSE 3000

CMD ["node", "dist/main"]
