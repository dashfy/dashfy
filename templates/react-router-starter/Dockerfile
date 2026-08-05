FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Corepack resolves the pnpm version from the "packageManager" field in package.json.
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
RUN pnpm install

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS prod-deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
RUN pnpm install --prod

FROM node:24-bookworm-slim AS runtime
# procps provides `ps`, which the system extension shells out to for process metrics.
# tini reaps zombies and forwards SIGTERM: as PID 1, Node would otherwise ignore it
# and every `docker stop` would wait out the full timeout before being killed.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates procps tini \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=5001
WORKDIR /app

COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/build ./build
COPY --chown=node:node package.json dashfy.server.ts dashfy.config.yml ./

USER node
EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "--import", "tsx", "dashfy.server.ts"]
