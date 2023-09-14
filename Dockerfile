FROM node:16-bullseye-slim AS builder

WORKDIR /home/node/app
COPY . .

RUN yarn install --frozen-lockfile && yarn cache clean -f && yarn build


FROM nginx:alpine as deploy

WORKDIR /usr/share/nginx/html

COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /home/node/app/build/ .

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]