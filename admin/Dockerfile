# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy source code
COPY . .

# Set production environment variables for build
ENV VITE_API_URL=https://api.4thitek.vn
ENV VITE_WS_URL=https://ws.4thitek.vn
ENV VITE_APP_ENV=production

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=120s --retries=3 \
  CMD curl -f http://127.0.0.1/index.html || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]