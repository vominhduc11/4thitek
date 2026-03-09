FROM ghcr.io/cirruslabs/flutter:stable AS builder

WORKDIR /app

COPY pubspec.yaml pubspec.lock ./
RUN flutter config --enable-web && flutter pub get

COPY . .

ARG API_BASE_URL=https://api.4thitek.vn
ARG WS_BASE_URL=
ARG PUBLIC_SITE_BASE_URL=https://4thitek.vn

RUN flutter build web --release \
    --dart-define=API_BASE_URL=${API_BASE_URL} \
    --dart-define=WS_BASE_URL=${WS_BASE_URL} \
    --dart-define=PUBLIC_SITE_BASE_URL=${PUBLIC_SITE_BASE_URL}

FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build/web /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/healthz >/dev/null || exit 1
