# Container build for hosts that take a Dockerfile (Koyeb, Zeabur, Fly.io,
# Google Cloud Run, SnapDeploy). Cloudflare and Render do not need this file.
#
# NOTE: this Dockerfile was written but could not be built in the authoring
# sandbox (no Docker daemon available there). The same code path it runs
# (`npm ci && npm run build && npm start`) was verified on plain Node 20.

FROM node:20-slim AS build
WORKDIR /app
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
# better-sqlite3 needs these only if no prebuilt binary matches; harmless otherwise
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV DATA_DIR=/data
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/shared ./shared
COPY --from=build /app/package.json ./package.json
RUN mkdir -p /data && chown -R node:node /data /app
USER node
VOLUME ["/data"]
EXPOSE 8080
CMD ["node", "server/index.js"]
