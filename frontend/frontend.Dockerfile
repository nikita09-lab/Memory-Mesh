# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .

# VITE_API_URL must be passed as a build arg by Render
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Production image ──────────────────────────────────────────────────────────
FROM nginx:alpine

# Security: run nginx as non-root
RUN sed -i 's/user  nginx;/user  nginx;\ndaemon off;/' /etc/nginx/nginx.conf || true

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
