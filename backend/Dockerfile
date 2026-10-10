# Build context is the repository root (so docs/openapi.yaml can ship with the image):
#   docker build -f backend/Dockerfile -t hstaff-api .
FROM node:20-alpine AS build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npm run build

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/backend/dist ./dist
COPY backend/migrations ./migrations
COPY backend/seeds ./seeds
COPY backend/knexfile.cjs ./
COPY docs /app/docs
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO- http://127.0.0.1:${PORT:-4000}/health || exit 1
# Migrations run on every boot (idempotent). Seeding is opt-in, see docker-compose.yml.
CMD ["sh", "-c", "node_modules/.bin/knex --knexfile knexfile.cjs migrate:latest && node dist/server.js"]
