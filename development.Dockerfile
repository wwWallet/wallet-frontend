FROM node:22-bullseye-slim AS dependencies

WORKDIR /dependencies

# Install dependencies first so rebuild of these layers is only needed when dependencies change
COPY lib/ ./lib/

WORKDIR /dependencies/lib/core
RUN yarn install && yarn cache clean -f && yarn build

WORKDIR /dependencies
COPY package.json yarn.lock .
RUN yarn install && yarn cache clean -f


FROM node:22-bullseye-slim  AS development

ENV NODE_PATH=/node_modules
COPY --from=dependencies /dependencies/node_modules /node_modules

WORKDIR /app
ENV NODE_ENV=development
CMD [ "yarn", "start-docker" ]

# src/ and public/ will be mounted from host, but we need some config files in the image for startup
COPY . .

# :hammer_and_wrench: Fix: Ensure Vite has permissions to write inside `/app`
RUN mkdir -p /app/node_modules/.vite && chmod -R 777 /app/node_modules

# Set user last so everything is readonly by default
USER node
