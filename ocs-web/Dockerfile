# ─── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS build

# Build-time args (passed from docker-compose build.args or --build-arg)
# These override .env.production values if set.
ARG VITE_API_BASE_URL=http://localhost:8080
ARG VITE_WS_URL=ws://localhost:8080

# Expose as env vars so Vite picks them up during `npm run build`
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

WORKDIR /app

# Cache node_modules unless package files change
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Stage 2: serve with nginx ────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# SPA routing: unknown paths fall back to index.html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
