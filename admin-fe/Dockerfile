FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --fund=false

FROM deps AS builder

WORKDIR /app

COPY . .

ARG VITE_API_ORIGIN=http://localhost:8080
ARG VITE_API_VERSION=
ARG VITE_API_BASE_URL=http://localhost:8080/api/v1
ENV VITE_API_ORIGIN=${VITE_API_ORIGIN}
ENV VITE_API_VERSION=${VITE_API_VERSION}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker-entrypoint.d/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
