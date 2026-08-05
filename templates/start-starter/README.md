# Dashfy App

A dashboard built with [Dashfy](https://github.com/dashfy/dashfy), scaffolded from the `start-starter` template (a minimal TanStack Start starting point).

## Getting started

Install dependencies:

```bash
pnpm install
```

Copy the example environment file and fill in any required values:

```bash
cp .env.example .env
```

Run the client and server together:

```bash
pnpm dev:all
```

- Client: http://localhost:3000
- Server: http://localhost:5001

The app runs TanStack Start in SPA mode (`spa: { enabled: true }`), so the Dashfy
UI renders client-side, and the Dashfy backend runs as a separate Node process
(`dashfy.server.ts`). The UI connects to the server over Socket.IO (which delivers
the dashboard configuration on connect).

## Production

Build the SPA and start the server, which serves the build and the WebSocket on the
same port:

```bash
pnpm build
pnpm start
```

- `pnpm build` emits the SPA into `dist/client`, which the server serves via the
  `staticDir` setting in `dashfy.config.yml`.
- The server honors `PORT` (default `5001`) and binds `0.0.0.0`.
- In production the UI connects to the same origin for WebSocket, so no extra
  configuration is needed.

## Docker

This project includes a `Dockerfile` that builds the SPA and runs the server in a
single container:

```bash
docker build -t my-dashfy-app .
docker run --rm -p 5001:5001 my-dashfy-app
```

To change dashboards without rebuilding, mount your config; the server watches it and
reloads automatically:

```bash
docker run --rm -p 5001:5001 \
  -v "$(pwd)/dashfy.config.yml:/app/dashfy.config.yml:ro" \
  my-dashfy-app
```

Commit `pnpm-lock.yaml` after your first install so image builds are reproducible.

## Adding extensions

Use the Dashfy CLI to add extensions (widgets + data sources):

```bash
npx dashfy@latest add github
npx dashfy@latest add system
```

This installs the extension's npm package and sets it up in `src/components/DashfyApp.tsx`,
`dashfy.server.ts`, `dashfy.config.yml`, and `.env`.

## Configuration

Edit `dashfy.config.yml` to add, remove, and arrange widgets on your dashboards.
