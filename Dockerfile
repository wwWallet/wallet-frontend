FROM node:21-bullseye-slim AS builder-base

WORKDIR /home/node/app

# Install dependencies first so rebuild of these layers is only needed when dependencies change
COPY package.json yarn.lock .
COPY .env .
RUN yarn cache clean -f && yarn install


FROM builder-base AS test

COPY . .
RUN npm run vitest


FROM builder-base AS builder

# This is just to make the builder stage depend on the test stage.
COPY --from=test /home/node/app/package.json /dev/null

COPY . .
RUN yarn build


FROM nginx:alpine AS deploy

WORKDIR /usr/share/nginx/html

COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /home/node/app/build/ .

EXPOSE 80

CMD nginx -g "daemon off;"
