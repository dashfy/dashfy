# Dashfy App

A dashboard built with [Dashfy](https://github.com/dashfy/dashfy), scaffolded from the `astro-app` template (GitHub, System, and Market Live extensions included).

## Getting started

Install dependencies:

```bash
pnpm install
```

Copy the example environment file and fill in any required values:

```bash
cp .env.example .env
# set GITHUB_TOKEN (https://github.com/settings/tokens)
```

Run the client and server together:

```bash
pnpm dev:all
```

- Client: http://localhost:3000
- Server: http://localhost:5001

## Production

Build the site and start the server, which serves the build and the WebSocket on
the same port:

```bash
pnpm build
pnpm start
```

- `pnpm build` outputs the static site to `build/`, which the server serves.
- The server honors `PORT` (default `5001`) and binds `0.0.0.0`.
- In production the UI connects to the same origin for WebSocket, so no extra
  configuration is needed.

## Docker

This project includes a `Dockerfile` that builds the site and runs the server in a
single container:

```bash
docker build -t my-dashfy-app .
docker run --rm -p 5001:5001 -e GITHUB_TOKEN=ghp_xxx my-dashfy-app
```

Pass secrets at runtime with `-e` — the image never contains them. To change dashboards
without rebuilding, mount your config; the server watches it and reloads automatically:

```bash
docker run --rm -p 5001:5001 \
  -v "$(pwd)/dashfy.config.yml:/app/dashfy.config.yml:ro" \
  my-dashfy-app
```

Commit `pnpm-lock.yaml` after your first install so image builds are reproducible.

## Project structure

```
.
├── src/
│   ├── components/
│   │   └── DashfyApp.tsx   # Widget registration (WidgetRegistry.addExtension) + React island
│   ├── layouts/
│   │   └── main.astro      # HTML shell
│   └── pages/
│       └── index.astro     # Renders <DashfyApp client:only="react" />
├── dashfy.config.yml       # Dashboard layout and widgets
├── dashfy.server.ts        # Server bootstrap + API registration
├── astro.config.mjs        # Astro config (React + /config dev proxy)
└── package.json
```

The Dashfy UI is a client-only React island (`client:only="react"`), and the
Dashfy backend runs as a separate Node process (`dashfy.server.ts`). During
development, Astro proxies `/config` to the server on port 5001.

## Adding more extensions

Use the Dashfy CLI to add extensions to this project:

```bash
npx dashfy@latest add json
```

## Configuration

Edit `dashfy.config.yml` to add, remove, and arrange widgets on your dashboards.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
