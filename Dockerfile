# syntax=docker/dockerfile:1@sha256:4edf897a3ffa55b89f906fc8cc78afdb3f1834cc9c7083565e611a8a7d5fe99e

FROM docker.io/library/node:26-slim@sha256:e6bedef217677b276c591795e169840edd9096dbf13f29df8ef8d1856b8820bc AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Node 25 dropped Corepack, so pnpm comes from its own image
COPY --from=ghcr.io/pnpm/pnpm:12.18.0@sha256:41c39d1c734b0a810669c07587888aa7dbe9ef9b4c8e98b346b3654f7b269b6d /opt/pnpm /opt/pnpm
RUN for bin in pnpm pn pnpx pnx; do ln -s "/opt/pnpm/$bin" "/usr/local/bin/$bin"; done

WORKDIR /app


FROM base AS build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY . .
RUN pnpm build


FROM base AS prod-deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN --mount=type=cache,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod


FROM base AS runtime

RUN groupadd --gid 1001 appgroup && \
    useradd --uid 1001 --gid 1001 --home-dir /app --shell /usr/sbin/nologin appuser

COPY --from=prod-deps --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=build --chown=appuser:appgroup /app/dist ./dist
COPY --from=build --chown=appuser:appgroup /app/scripts/serve.ts ./scripts/serve.ts
COPY --from=build --chown=appuser:appgroup /app/scripts/compression.ts ./scripts/compression.ts
COPY --from=build --chown=appuser:appgroup /app/package.json ./package.json

ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS="--enable-source-maps"

USER appuser:appgroup
EXPOSE 3000

CMD ["node", "scripts/serve.ts"]
