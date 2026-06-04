# syntax=docker/dockerfile:1

ARG CLOUDSMITH_WORKSPACE
ARG CLOUDSMITH_REPOSITORY

# ---------- Stage 1: Build with dev base image ----------

FROM docker.cloudsmith.io/${CLOUDSMITH_WORKSPACE}/${CLOUDSMITH_REPOSITORY}/chainguard/node:latest-dev AS dev

ARG CLOUDSMITH_SERVICE
ARG CLOUDSMITH_WORKSPACE
ARG CLOUDSMITH_REPOSITORY
ARG CLOUDSMITH_API_KEY

WORKDIR /app

COPY package.json package-lock.json ./

RUN echo "registry=https://npm.cloudsmith.io/${CLOUDSMITH_WORKSPACE}/${CLOUDSMITH_REPOSITORY}/" > .npmrc && \
    echo "//npm.cloudsmith.io/${CLOUDSMITH_WORKSPACE}/${CLOUDSMITH_REPOSITORY}/:_auth=$(echo -n "${CLOUDSMITH_SERVICE}:${CLOUDSMITH_API_KEY}" | base64 -w 0)" >> .npmrc && \
    echo "always-auth=true" >> .npmrc && \
    npm ci --ignore-scripts && \
    rm -f .npmrc

COPY src/ ./src/

# ---------- Stage 2: Final runtime image ----------

FROM docker.cloudsmith.io/${CLOUDSMITH_WORKSPACE}/${CLOUDSMITH_REPOSITORY}/chainguard/node:latest

ARG CLOUDSMITH_WORKSPACE
ARG CLOUDSMITH_REPOSITORY
ARG BUILD_NUMBER=dev
ARG BUILD_DATE=unknown
ARG GIT_SHA=unknown

WORKDIR /app

COPY --from=dev /app/node_modules ./node_modules
COPY --from=dev /app/package.json ./
COPY --from=dev /app/package-lock.json ./
COPY --from=dev /app/src ./src

ENV BUILD_NUMBER=${BUILD_NUMBER}
ENV BUILD_DATE=${BUILD_DATE}
ENV GIT_SHA=${GIT_SHA}
ENV CLOUDSMITH_WORKSPACE=${CLOUDSMITH_WORKSPACE}
ENV CLOUDSMITH_REPOSITORY=${CLOUDSMITH_REPOSITORY}
ENV NODE_ENV=production

EXPOSE 3000

ENTRYPOINT ["node", "src/index.js"]
