# syntax=docker/dockerfile:1@sha256:ecfaec9ed6d810b56388c508f4121597bfbba70d41a6dfeee4d8cad5f295fc32
# https://depot.dev/docs/container-builds/optimal-dockerfiles/node-pnpm-dockerfile

FROM docker.io/library/node:22-slim@sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

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
COPY --from=build --chown=appuser:appgroup /app/package.json ./package.json

ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS="--enable-source-maps"

USER appuser:appgroup
EXPOSE 3000

CMD ["node", "dist/server/node.js"]
