FROM node:21-bullseye-slim AS builder

WORKDIR /home/node/app

# Install dependencies first so rebuild of these layers is only needed when dependencies change
COPY package.json yarn.lock .
RUN --mount=type=secret,id=npmrc,required=true,target=./.npmrc,uid=1000 \
	yarn cache clean -f && yarn install

COPY . .
RUN yarn build


FROM nginx:alpine as deploy

WORKDIR /usr/share/nginx/html

COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /home/node/app/build/ .

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
