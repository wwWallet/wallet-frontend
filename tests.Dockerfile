FROM node:21-bullseye-slim AS builder-base

WORKDIR /home/node/app

# Install dependencies first so rebuild of these layers is only needed when dependencies change
COPY package.json yarn.lock .
COPY .env.template .env
RUN yarn cache clean -f && yarn install


FROM builder-base AS test

COPY . .
RUN npm run vitest
