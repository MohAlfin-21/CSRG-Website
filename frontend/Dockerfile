# Frontend Dockerfile (React + Vite → nginx)
# Multi-stage: build with Node, serve with non-root nginx
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (leverages Docker layer cache)
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source files (respects .dockerignore)
COPY . .

# Set same-origin base URL for production build
ARG VITE_BACKEND_URL=""
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Build the app with Vite (source maps disabled in vite.config.js)
RUN npm run build

# ── Production stage (rootless unprivileged nginx) ────────────────────────────
FROM nginxinc/nginx-unprivileged:1.26-alpine

COPY --from=build --chown=101:101 /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Explicit non-root user (UID 101 corresponds to 'nginx' in nginx-unprivileged)
USER 101

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
