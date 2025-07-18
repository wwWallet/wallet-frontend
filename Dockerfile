FROM node:22-bullseye-slim AS wallet-common-builder

WORKDIR /lib/wallet-common
COPY ./lib/wallet-common/package.json ./lib/wallet-common/yarn.lock ./
RUN yarn install --pure-lockfile

COPY ./lib/wallet-common/ ./
RUN yarn build


FROM node:22-bullseye-slim AS builder-base

WORKDIR /app

COPY package.json yarn.lock .
COPY --from=wallet-common-builder /lib/wallet-common/ ./lib/wallet-common/
RUN yarn install --pure-lockfile


FROM builder-base AS development

ENV NODE_ENV=development
CMD ["yarn", "start-docker"]

# src/ and public/ will be mounted from host, but we need some config files in the image for startup
COPY . .

# Set user last so everything is readonly by default
USER node


FROM builder-base AS test

COPY . .
# Run tests during Docker build
RUN npm run test
# Run tests if image is run as container
CMD ["npm", "run", "test"]


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
