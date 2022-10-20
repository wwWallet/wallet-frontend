FROM node:16-alpine AS build
WORKDIR /build
# Copy app files
COPY . .
# ==== BUILD =====
# Install dependencies (npm ci makes sure the exact versions in the lockfile gets installed)
RUN yarn install --frozen-lockfile
# Build the app
COPY package.json package.json
COPY yarn.lock yarn.lock
COPY public/ public
COPY src/ src
RUN yarn build
# ==== RUN =======
# Set the env to "production"
ENV NODE_ENV production
# Expose the port on which the app will be running (3000 is the default that `serve` uses)


FROM httpd:alpine
WORKDIR /var/www/html
COPY --from=build /build/build/ .