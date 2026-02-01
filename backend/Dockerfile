# Backend Dockerfile
FROM node:20-alpine

# Install PostgreSQL client, OpenSSL and netcat
RUN apk add --no-cache postgresql-client netcat-openbsd openssl openssl-dev libc6-compat

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Expose port
EXPOSE 3001

# Start the server
ENTRYPOINT ["./docker-entrypoint.sh"]
