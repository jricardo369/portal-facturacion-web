# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Angular 22 (application builder): el output va a dist/<proyecto>/browser
COPY --from=build /app/dist/portal-facturacion-web/browser /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ >/dev/null || exit 1
