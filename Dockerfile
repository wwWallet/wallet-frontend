FROM node:21-bullseye-slim AS builder-base

WORKDIR /home/node/app

# Install dependencies first so rebuild of these layers is only needed when dependencies change
COPY package.json yarn.lock .
COPY .env.template .env
RUN --mount=type=secret,id=npmrc,required=true,target=./.npmrc,uid=1000 \
	yarn cache clean -f && yarn install


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

COPY ./var_replacement.sh /

EXPOSE 80

RUN chmod +x /var_replacement.sh && cat /var_replacement.sh

CMD /bin/sh /var_replacement.sh /variables.vars && nginx -g "daemon off;"
