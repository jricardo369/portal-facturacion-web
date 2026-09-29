# syntax=docker/dockerfile:1
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Angular 16 (browser builder clásico): el output va directo a dist/<proyecto>
COPY --from=build /app/dist/portal-facturacion-web /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/ >/dev/null || exit 1
