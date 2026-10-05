# Single container on purpose: vite.config.js proxies /api to localhost:3001, so the web and API processes share a network namespace.
# .dockerignore keeps .env and the host's node_modules (native better-sqlite3 build) out of the image.
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN node server/db/seed.js

EXPOSE 3000 3001

CMD ["sh", "-c", "node server/index.js & npx vite preview --port 3000 --host 0.0.0.0"]
