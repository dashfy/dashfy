# Configuration & Dashboards

Dashfy has two configuration files: `dashfy.json` (project setup for the CLI) and `dashfy.config.yml` (the dashboards your app renders).

## Contents

- `dashfy.json` — project configuration
- `dashfy.config.yml` — dashboards and widget grid
- The widget grid (x / y / columns / rows)
- Widget props
- Theming

---

## `dashfy.json` — project configuration

Written by `dashfy init` and read by `add` / `remove` / `doctor`. It declares where the CLI applies changes and any custom registries.

```jsonc
{
  "$schema": "https://dashfy.dev/schema.json",
  "registries": {
    "@acme": "https://acme.com/r/{name}.json",
  },
  "paths": {
    "app": "src/App.tsx",
    "server": "dashfy.server.ts",
    "config": "dashfy.config.yml",
    "env": ".env",
  },
}
```

- `registries` — custom registry endpoints, merged over the built-in `@getdashfy`. A value is a URL template containing `{name}`, or an object with `url` plus optional `params` / `headers` (values may reference `${ENV_VAR}`). See [registry.md](./registry.md).
- `paths` — where the CLI applies changes. These take precedence over the CLI's heuristic file discovery (preflight). All keys are optional.

---

## `dashfy.config.yml` — dashboards

Defines the dashboards your app renders. Top level:

```yaml
port: 5001
apis:
  pollInterval: 300000
dashboards:
  - title: Dashfy Dashboard
    columns: 1
    rows: 1
    widgets:
      - extension: dashfy
        widget: Inspector
        x: 0
        y: 0
        columns: 1
        rows: 1
```

- `port` — the Dashfy server port.
- `apis.pollInterval` — default poll interval (ms) for `poll`-mode data sources.
- `dashboards` — an array of dashboards. Each has a `title`, a grid size (`columns` × `rows`), and a `widgets` array.

When you `dashfy add` an extension, its `starter` blocks are appended here as a new dashboard.

---

## The widget grid

Each entry in a dashboard's `widgets` array places one widget on the grid:

```yaml
dashboards:
  - title: GitHub Dashboard
    columns: 4
    rows: 3
    widgets:
      - extension: github
        widget: RepoBadge
        x: 0
        y: 0
        columns: 1
        rows: 1
        repository: vercel/next.js
      - extension: github
        widget: CommitActivityLine
        x: 0
        y: 1
        columns: 2
        rows: 1
        repository: vercel/next.js
```

Required keys on every widget:

| Key         | Meaning                                                 |
| ----------- | ------------------------------------------------------- |
| `extension` | The extension `id` (must be installed/registered).      |
| `widget`    | A widget export name from that extension's `widgets[]`. |
| `x`         | Column offset (0-based).                                |
| `y`         | Row offset (0-based).                                   |
| `columns`   | How many columns the widget spans (`>= 1`).             |
| `rows`      | How many rows the widget spans (`>= 1`).                |

Grid rules (see [rules/layout.md](./rules/layout.md)):

- `x + columns <= dashboard.columns` and `y + rows <= dashboard.rows`.
- `x >= 0`, `y >= 0`, `columns >= 1`, `rows >= 1`.
- Widgets must not overlap.

---

## Widget props

Any keys beyond the required ones are passed to the widget as props (the schema is passthrough). For example `repository`, `user`, `organization`, `conference`, `feedId`, `showChart`. The valid props depend on the widget — check the extension's docs/README. Examples from the bundled extensions:

```yaml
# GitHub
- extension: github
  widget: PullRequests
  x: 2
  y: 1
  columns: 2
  rows: 1
  repository: vercel/next.js
  state: open

# NBA
- extension: nba
  widget: Standings
  x: 1
  y: 0
  columns: 1
  rows: 2
  conference: East

# Market Live
- extension: market-live
  widget: PriceLive
  x: 0
  y: 0
  columns: 1
  rows: 1
  feedId: crypto.BTC_USD
  showChart: false
```

---

## Theming

Dashfy ships a customizable theme system with pre-built themes in the `@getdashfy/themes` package (Tailwind CSS based). Use it to switch the dashboard's look without touching widget code. Refer to the package's README for the available themes and how to apply one in the scaffolded app. When adding custom colors, follow the app's Tailwind/global CSS setup rather than hardcoding raw color values in widgets.
