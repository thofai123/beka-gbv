# Stage 1: Build React/Vite frontend
FROM node:20-slim AS frontend-builder
WORKDIR /build/app
COPY app/package*.json ./
RUN npm install
COPY app/ ./
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Stage 2: Build & run Node/Express + Prisma backend serving compiled frontend
FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /srv/beka

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/ ./backend/
RUN cd backend && npx prisma generate

COPY --from=frontend-builder /build/app/dist ./app/dist

WORKDIR /srv/beka/backend
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Sync any safe Prisma schema updates to Supabase on boot, then start Express
CMD ["sh", "-c", "npx prisma db push --skip-generate && node src/index.js"]
