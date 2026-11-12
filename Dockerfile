# PerFisio: Express + pg, só dependências JS puras (sem build). Runtime = Alpine + binário do node.
ARG NODE_VERSION=22
# igual à versão do Alpine de node:${NODE_VERSION}-alpine:
#   docker run --rm node:22-alpine cat /etc/alpine-release
ARG ALPINE_VERSION=3.24

# ── dependências de produção ─────────────────────────────────
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts --no-audit --no-fund

# ── runtime ──────────────────────────────────────────────────
FROM alpine:${ALPINE_VERSION}

# tini repassa o SIGTERM ao node (node como PID 1 ignora: 10 s para parar).
RUN apk add --no-cache libstdc++ tini \
 && addgroup -g 1000 node && adduser -u 1000 -G node -s /bin/sh -D node
COPY --from=deps /usr/local/bin/node /usr/local/bin/node

ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
# o servidor serve a raiz do repo (server/..): páginas .html, app/, admin/, assets/
COPY package.json ./
COPY server ./server
COPY *.html ./
COPY app ./app
COPY admin ./admin
COPY assets ./assets

USER node

# /robots.txt: rota pública e barata (não depende do banco)
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/robots.txt').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server/server.js"]
