FROM node:22-bullseye-slim AS builder-base

RUN apt-get update -y && apt-get install -y git && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/app
# Install dependencies first so rebuild of these layers is only needed when dependencies change
COPY package.json yarn.lock .
COPY .env.template .env
RUN yarn cache clean -f && yarn install --pure-lockfile

COPY . .
RUN npm run vitest
