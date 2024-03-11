FROM node:16-bullseye-slim as dependencies

WORKDIR /dependencies

# Install dependencies first so rebuild of these layers is only needed when dependencies change
COPY package.json yarn.lock .
RUN --mount=type=secret,id=npmrc,required=true,target=./.npmrc,uid=1000 \
	yarn install && yarn cache clean -f


FROM node:16-bullseye-slim as development

ENV NODE_PATH=/node_modules
COPY --from=dependencies /dependencies/node_modules /node_modules

WORKDIR /app
ENV NODE_ENV development
CMD [ "yarn", "start-docker" ]

# src/ and public/ will be mounted from host, but we need some config files in the image for startup
COPY . .

# Set user last so everything is readonly by default
USER node
