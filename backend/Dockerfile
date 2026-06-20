FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
COPY src ./src

ENV PORT=3001
ENV TZ=America/Sao_Paulo

CMD npx prisma@5 generate && npx prisma@5 db push --accept-data-loss && node src/server.js
