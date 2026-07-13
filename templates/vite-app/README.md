# Dashfy App

A dashboard built with [Dashfy](https://github.com/dashfy/dashfy), scaffolded from the `vite-app` template (GitHub, NBA, System, and Market Live extensions included).

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
│   ├── App.tsx           # Widget registration (WidgetRegistry.addExtension)
│   └── main.tsx          # App entry point + theme loading
├── dashfy.config.yml     # Dashboard layout and widgets
├── dashfy.server.ts      # Server bootstrap + API registration
└── package.json
```

## Adding more extensions

Use the Dashfy CLI to add extensions to this project:

```bash
npx dashfy@latest add json
```

## Configuration

Edit `dashfy.config.yml` to add, remove, and arrange widgets on your dashboards.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
