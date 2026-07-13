# Dashfy App

A dashboard built with [Dashfy](https://github.com/dashfy/dashfy), scaffolded from the `react-router-starter` template (a minimal React Router v7 starting point).

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

The app runs React Router in SPA mode (`ssr: false`), so the Dashfy UI renders
client-side, and the Dashfy backend runs as a separate Node process
(`dashfy.server.ts`). During development, Vite proxies `/config` to the server on
port 5001.

## Adding extensions

Use the Dashfy CLI to add extensions (widgets + data sources):

```bash
npx dashfy@latest add github
npx dashfy@latest add system
```

This installs the extension's npm package and sets it up in `app/components/DashfyApp.tsx`,
`dashfy.server.ts`, `dashfy.config.yml`, and `.env`.

## Configuration

Edit `dashfy.config.yml` to add, remove, and arrange widgets on your dashboards.
