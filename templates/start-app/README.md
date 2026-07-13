# Dashfy App

A dashboard built with [Dashfy](https://github.com/dashfy/dashfy), scaffolded from the `start-app` template (GitHub, NBA, System, and Market Live extensions included).

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

## Project structure

```
.
├── src/
│   ├── router.tsx               # TanStack Router setup
│   ├── routeTree.gen.ts         # Generated route tree (do not edit)
│   ├── routes/
│   │   ├── __root.tsx           # Root shell (HeadContent / Scripts)
│   │   └── index.tsx            # Renders <DashfyApp />
│   └── components/
│       └── DashfyApp.tsx        # Widget registration (WidgetRegistry.addExtension) + island
├── dashfy.config.yml            # Dashboard layout and widgets
├── dashfy.server.ts             # Server bootstrap + API registration
├── vite.config.ts               # Vite config (TanStack Start SPA mode)
└── package.json
```

The app runs TanStack Start in SPA mode (`spa: { enabled: true }`), so the Dashfy
UI renders client-side, and the Dashfy backend runs as a separate Node process
(`dashfy.server.ts`). The UI connects to the server over Socket.IO (which delivers
the dashboard configuration on connect).

## Adding more extensions

Use the Dashfy CLI to add extensions to this project:

```bash
npx dashfy@latest add json
```

## Configuration

Edit `dashfy.config.yml` to add, remove, and arrange widgets on your dashboards.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
