# ==========================================
# STAGE 1: Build the React Frontend
# ==========================================
FROM node:20-slim AS frontend-build
WORKDIR /srv/beka/app

# Copy frontend dependency manifests and install
COPY app/package*.json ./
RUN npm install

# Copy frontend source code and build
COPY app/ ./
RUN npm run build


# ==========================================
# STAGE 2: Production Backend Server
# ==========================================
FROM node:20-slim

# Install OpenSSL required by Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /srv/beka

# Copy backend package files and prisma schema
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma

# Install production dependencies for backend
RUN cd backend && npm install --omit=dev

# Copy backend source code
COPY backend/ ./backend/

# CRITICAL: Pull the built frontend artifacts from Stage 1 into the exact absolute path
COPY --from=frontend-build /srv/beka/app/dist /srv/beka/app/dist

# Set working directory to backend to run the server
WORKDIR /srv/beka/backend
CMD ["npm", "start"]