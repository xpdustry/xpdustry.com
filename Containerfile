# syntax=docker/dockerfile:1
#
# Two stages. The build stage installs everything, because Vite and TypeScript
# are build tools; the runtime stage copies the two dist trees and a
# production-only node_modules, so the image carries no compiler.
#
#   podman build -t xpdustry-website .
#   podman run --rm -p 3000:3000 xpdustry-website

FROM docker.io/library/node:22-slim AS base
ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH"
# The pinned packageManager in package.json decides the pnpm version.
RUN corepack enable
WORKDIR /app


FROM base AS deps
# The lockfile alone, so a source edit does not re-resolve the dependency
# graph. `pnpm fetch` populates the store from the lockfile without needing
# package.json, which is what makes this layer stable.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm fetch --frozen-lockfile


FROM deps AS build
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --offline
COPY . .
RUN pnpm build
# A second, production-only tree for the runtime stage. Installed into a
# separate prefix so the build's own node_modules stays intact above.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --offline --prod --node-linker=hoisted \
      --dir /app --lockfile-dir /app --virtual-store-dir /app/.pnpm-prod \
      --modules-dir /app/node_modules_prod


FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS=--enable-source-maps

# Fixed UID/GID so a bind-mounted volume has predictable ownership. The stock
# `node` user is 1000; 1001 is ours and is created explicitly.
RUN groupadd --gid 1001 xpdustry \
 && useradd --uid 1001 --gid 1001 --create-home --shell /usr/sbin/nologin xpdustry

COPY --from=build --chown=1001:1001 /app/node_modules_prod ./node_modules
COPY --from=build --chown=1001:1001 /app/dist ./dist
COPY --from=build --chown=1001:1001 /app/package.json ./package.json

USER 1001:1001
EXPOSE 3000

# The authored Node entry, not `vite preview`: it owns the pollers, the
# static file serving and the signal handling.
CMD ["node", "dist/server/node.js"]
