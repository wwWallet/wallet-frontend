FROM node:22-bullseye-slim AS builder-base


RUN apt-get update -y && apt-get install -y git && rm -rf /var/lib/apt/lists/* && git clone --branch master --single-branch --depth 1 https://github.com/wwWallet/wallet-common.git /lib/wallet-common

WORKDIR /lib/wallet-common
RUN yarn install && yarn build

WORKDIR /home/node/app
# Install dependencies first so rebuild of these layers is only needed when dependencies change
COPY package.json .
COPY .env.template .env

WORKDIR /home/node/app

RUN yarn cache clean -f && yarn add /lib/wallet-common && yarn install


FROM builder-base AS test

COPY . .
RUN npm run vitest
