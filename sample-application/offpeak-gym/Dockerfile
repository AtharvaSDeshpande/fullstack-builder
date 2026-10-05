FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN node server/db/seed.js

EXPOSE 3000 3001

CMD ["sh", "-c", "node server/index.js & npx vite preview --port 3000 --host 0.0.0.0"]
