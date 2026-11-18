# syntax=docker/dockerfile:1

# Misma versión de Node que usa el workflow de GitHub para correr los tests (package.json pide >= 22).
ARG NODE_VERSION=24

# Etapa 1: construir. "npm ci" instala todo y dispara "prepare" (npm run build), que deja dist/.
FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /app
COPY . .
RUN npm ci

# Etapa 2: la imagen que se publica y se despliega.
FROM node:${NODE_VERSION}-bookworm-slim
WORKDIR /app
COPY --from=build --chown=node:node /app ./
USER node
# Se llama a node directo, igual que "npm start", para que la señal de apagado llegue a la app.
CMD ["node", "dist/server/server-instrumentacion.js"]