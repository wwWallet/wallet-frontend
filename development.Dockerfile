FROM node:16-bullseye-slim AS development

WORKDIR /home/node/app
COPY package.json .
COPY yarn.lock .
RUN mkdir -p /home/node/app/node_modules
COPY --chown=node:node . .

RUN yarn install && yarn cache clean -f

ENV NODE_ENV development
RUN chown -R node:node  /home/node/app/node_modules
USER node

CMD [ "yarn", "start" ]