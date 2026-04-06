# Secuird-docs

[![Docusaurus](https://img.shields.io/badge/Docusaurus-3.9.2-blue?logo=docusaurus)](https://docusaurus.io/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0-brightgreen?logo=node)](https://nodejs.org/)

Modern documentation website built with Docusaurus 3.9.2.

## Project Overview

Secuird-docs is the official documentation site for Secuird, built with Docusaurus 3.9.2. It provides comprehensive guides, API references, and tutorials for the Secuird platform.

## Prerequisites

- **Node.js**: >= 20.0
- **npm**: Latest stable version
- **git**: For version control

## Quick Start

### Option 1: npm

```bash
npm i && npm run start
```

### Option 2: Docker

```bash
docker-compose up
```

## Development

Start the development server:

```bash
npm run start
```

This command starts a local development server at `http://localhost:3000`. Most changes are reflected live without restarting the server. The site uses React Fast Refresh for instant updates.

## Build

Generate static production files:

```bash
npm run build
```

This command generates static content into the `build` directory. The build is minified and optimized for best performance.

Preview the production build locally:

```bash
npm run serve
```

## Deployment

### GitHub Pages

Using SSH:

```bash
USE_SSH=true npm run deploy
```

Using GitHub token:

```bash
GIT_USER=<Your GitHub username> npm run deploy
```

### Docker

Single command deployment:

```bash
docker-compose up --build
```

The site will be available at `http://localhost:80`.

### Static Hosting

After building with `npm run build`, deploy the contents of the `build` directory to any static hosting service (Netlify, Vercel, S3, Apache, Nginx, etc.).

## Docker Setup

Containerized production deployment using nginx to serve static files.

- **Dockerfile**: Multi-stage build (node:20-alpine → nginx:alpine)
- **docker-compose.yml**: Single production service on port 80
- **nginx.conf**: SPA routing, gzip compression, cache headers

Environment variables:
- `NODE_ENV`: Set to `production` for production builds

## Troubleshooting

### Node.js version issues

Ensure you have Node.js >= 20.0 installed:

```bash
node --version
```

Use [nvm](https://github.com/nvm-sh/nvm) to manage Node versions:

```bash
nvm install 20
nvm use 20
```

### Port conflicts

If port 3000 is in use, specify a different port:

```bash
npm run start -- --port 3001
```

### Clear cache

If you encounter build issues:

```bash
npm run clear
npm run build
```

### TypeScript errors

Run type checking:

```bash
npm run typecheck
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
