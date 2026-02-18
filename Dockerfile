FROM node:22-bullseye-slim AS builder-base

RUN apt-get update -y && apt-get install -y git fontconfig && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/app

# Install dependencies first so rebuild of these layers is only needed when dependencies change
COPY package.json yarn.lock ./
RUN --mount=type=cache,target=/usr/local/share/.cache yarn cache clean -f && yarn install --frozen-lockfile || yarn install --frozen-lockfile --network-concurrency 1

FROM builder-base AS test

COPY . .
RUN npm run test


FROM builder-base AS builder

# This is just to make the builder stage depend on the test stage.
COPY --from=test /home/node/app/package.json /dev/null

COPY . .
RUN --mount=type=secret,id=wallet_frontend_envfile,dst=/home/node/app/.env,required=false NODE_OPTIONS=--max-old-space-size=2048 yarn build


FROM nginx:alpine AS deploy

RUN apk add --no-cache nodejs=~24 npm=~11

WORKDIR /usr/share/nginx/

COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=nginx:nginx /home/node/app/docker-entrypoint.sh .
COPY --from=builder --chown=nginx:nginx /home/node/app/dist/ ./html/
COPY --from=builder --chown=nginx:nginx /home/node/app/dist/ ./dist/
COPY --from=builder --chown=nginx:nginx /home/node/app/config/ ./config/
COPY --from=builder --chown=nginx:nginx /home/node/app/branding/ ./branding/

# TODO: These should likely be pinned to specific versions
RUN npm install -g tsx
RUN cd ./config && npm install \
	sharp \
	jsdom \
	zod \
	color-convert

EXPOSE 80

CMD ["./docker-entrypoint.sh"]
