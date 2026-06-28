FROM node:20-slim AS builder

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Build — VITE_API_URL injected at build time via Railway/Render env var
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ── Production image ──────────────────────────────────────────────────────────
FROM nginx:alpine

# Copy built frontend
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
