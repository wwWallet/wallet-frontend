# Dockerfile for E2E testing of wallet-frontend
# This version uses ARG to pass environment configuration for the build
# for better compatibility with different Docker Compose versions

FROM node:22-bullseye-slim AS builder-base

RUN apt-get update -y && apt-get install -y git fontconfig && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/app

# Install dependencies first so rebuild of these layers is only needed when dependencies change
COPY package.json yarn.lock ./
RUN yarn cache clean -f && yarn install --frozen-lockfile || yarn install --frozen-lockfile --network-concurrency 1


FROM builder-base AS builder

COPY . .

# Build-time environment variables for Vite
ARG VITE_WALLET_BACKEND_URL=http://localhost:8080
ARG VITE_WS_URL=ws://localhost:8080
ARG VITE_WEBAUTHN_RPID=localhost
ARG VITE_OPENID4VCI_REDIRECT_URI=http://localhost:3000/
ARG VITE_STATIC_PUBLIC_URL=http://localhost:3000
ARG VITE_STATIC_NAME="E2E Test Wallet"
ARG VITE_LOGIN_WITH_PASSWORD=false
ARG VITE_DID_KEY_VERSION=jwk_jcs-pub
ARG VITE_APP_VERSION=e2e-test
ARG VITE_DISPLAY_CONSOLE=true
ARG VITE_OPENID4VCI_PROOF_TYPE_PRECEDENCE="attestation,jwt"
ARG VITE_OPENID4VP_SAN_DNS_CHECK=false
ARG VITE_OPENID4VP_SAN_DNS_CHECK_SSL_CERTS=false
ARG VITE_VALIDATE_CREDENTIALS_WITH_TRUST_ANCHORS=true
ARG VITE_MULTI_LANGUAGE_DISPLAY=true
ARG VITE_DISPLAY_ISSUANCE_WARNINGS=false

# Set them as environment variables for the build
ENV VITE_WALLET_BACKEND_URL=$VITE_WALLET_BACKEND_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_WEBAUTHN_RPID=$VITE_WEBAUTHN_RPID
ENV VITE_OPENID4VCI_REDIRECT_URI=$VITE_OPENID4VCI_REDIRECT_URI
ENV VITE_STATIC_PUBLIC_URL=$VITE_STATIC_PUBLIC_URL
ENV VITE_STATIC_NAME=$VITE_STATIC_NAME
ENV VITE_LOGIN_WITH_PASSWORD=$VITE_LOGIN_WITH_PASSWORD
ENV VITE_DID_KEY_VERSION=$VITE_DID_KEY_VERSION
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ENV VITE_DISPLAY_CONSOLE=$VITE_DISPLAY_CONSOLE
ENV VITE_OPENID4VCI_PROOF_TYPE_PRECEDENCE=$VITE_OPENID4VCI_PROOF_TYPE_PRECEDENCE
ENV VITE_OPENID4VP_SAN_DNS_CHECK=$VITE_OPENID4VP_SAN_DNS_CHECK
ENV VITE_OPENID4VP_SAN_DNS_CHECK_SSL_CERTS=$VITE_OPENID4VP_SAN_DNS_CHECK_SSL_CERTS
ENV VITE_VALIDATE_CREDENTIALS_WITH_TRUST_ANCHORS=$VITE_VALIDATE_CREDENTIALS_WITH_TRUST_ANCHORS
ENV VITE_MULTI_LANGUAGE_DISPLAY=$VITE_MULTI_LANGUAGE_DISPLAY
ENV VITE_DISPLAY_ISSUANCE_WARNINGS=$VITE_DISPLAY_ISSUANCE_WARNINGS

RUN NODE_OPTIONS=--max-old-space-size=2048 yarn build


FROM nginx:alpine AS deploy

WORKDIR /usr/share/nginx/html

RUN apk add --no-cache wget

COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /home/node/app/dist/ .

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
