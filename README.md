# Cloudsmith NPM + Docker Demo

Example Node.js application demonstrating Cloudsmith as a unified artifact management platform — NPM packages proxied through Cloudsmith, Docker images built with [Chainguard](https://chainguard.dev) base images, and pushed to Cloudsmith's Docker registry via GitHub Actions with OIDC authentication.

## Quick Start (local)

```bash
# Copy and edit .npmrc with your Cloudsmith credentials
cp .npmrc.example .npmrc

npm install
npm start
# Visit http://localhost:3000
```

## Docker Build (local)

```bash
docker build \
  --build-arg CLOUDSMITH_WORKSPACE=cooke-industries \
  --build-arg CLOUDSMITH_REPOSITORY=npm-demo \
  --build-arg CLOUDSMITH_API_KEY=your-api-key \
  --build-arg CLOUDSMITH_SERVICE=your-service-account \
  -t npm-demo:local .

docker run -p 3000:3000 docker.cloudsmith.io/cooke-industries/npm-demo/node-app-dev:3
```

## CI/CD

The GitHub Actions workflow (`.github/workflows/node-app.yml`) authenticates to Cloudsmith via OIDC, installs NPM dependencies through the Cloudsmith proxy, runs tests, builds an ARM64 Docker image using Chainguard Node.js base images, and pushes to Cloudsmith's Docker registry.

Update the `env` block in the workflow with your Cloudsmith workspace and repository slugs.
# npm-app
