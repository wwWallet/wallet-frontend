FROM node:22-bullseye-slim AS builder-base

WORKDIR /app

# Install dependencies first so rebuild of these layers is only needed when dependencies change
COPY lib/ ./lib/
WORKDIR /app/lib/wallet-common
RUN yarn install && yarn build

WORKDIR /app
COPY package.json yarn.lock .
RUN yarn cache clean -f && yarn install


FROM builder-base AS development

ENV NODE_ENV=development
CMD [ "yarn", "start-docker" ]

# src/ and public/ will be mounted from host, but we need some config files in the image for startup
COPY . .

# :hammer_and_wrench: Fix: Ensure Vite has permissions to write inside `node_modules`
RUN mkdir -p /app/node_modules/.vite && chown -R node /app/node_modules

# Set user last so everything else is readonly by default
USER node


FROM builder-base AS test

COPY . .
RUN SLOW_TESTS=true npm run test


FROM builder-base AS builder

# This is just to make the builder stage depend on the test stage.
COPY --from=test /app/package.json /dev/null

COPY . .
COPY .env.prod .env
RUN yarn build


FROM nginx:alpine AS deploy

WORKDIR /usr/share/nginx/html

COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/ .

EXPOSE 80

CMD nginx -g "daemon off;"
