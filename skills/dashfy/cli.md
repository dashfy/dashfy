# Dashfy CLI Reference

Project configuration is read from `dashfy.json`. Dashboards are defined in `dashfy.config.yml`.

> **IMPORTANT:** Always run commands using the project's package runner: `npx dashfy@latest`, `pnpm dlx dashfy@latest`, or `bunx dashfy@latest`. The CLI auto-detects the package manager from the lockfile / `npm_config_user_agent`; there is no `--package-manager` flag.

> **IMPORTANT:** Only use the flags documented below. Do not invent flags — if a flag isn't listed here, it doesn't exist.

## Contents

- Global flags
- Commands: init, add, remove, search, view, docs, info, doctor
- Registry commands: registry build, registry validate, registry add, registry remove
- MCP commands: mcp, mcp init
- Templates
- Package runner
- Environment variables

---

## Global flags

These apply to every command and may be placed before the command (e.g. `dashfy --json add @getdashfy/github`):

| Flag            | Description                                                      |
| --------------- | ---------------------------------------------------------------- |
| `--json`        | Emit machine-readable JSON only; suppress spinners/status lines. |
| `--silent`      | Mute non-error output.                                           |
| `-v, --version` | Print the CLI version.                                           |

`info`, `search`, `view`, `docs`, and `doctor` also accept `--json` after the command.

---

## Commands

### `init` — Scaffold a new app

```bash
npx dashfy@latest init [name] [options]
```

Scaffolds a runnable Dashfy app (a framework client + Node server + config). Templates are fetched at runtime from the Dashfy repo. `create` is an alias.

| Flag                    | Short | Description                                                                                                                                                                        | Default        |
| ----------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| `--template <template>` | `-t`  | Template: `vite-starter` (default), `vite-app`, `astro-starter`, `astro-app`, `next-starter`, `next-app`, `react-router-starter`, `react-router-app`, `start-starter`, `start-app` | `vite-starter` |
| `--extensions <names>`  | `-e`  | Comma-separated extensions to set up (skips prompt; `*-starter`)                                                                                                                   | —              |
| `--cwd <cwd>`           | `-c`  | Working directory                                                                                                                                                                  | current        |
| `--no-install`          |       | Skip installing npm dependencies                                                                                                                                                   | install on     |
| `--yes`                 | `-y`  | Accept defaults / skip prompts                                                                                                                                                     | `false`        |

- `vite-starter` — minimal Vite app; the CLI prompts for extensions and sets them up.
- `vite-app` — full Vite demo (GitHub, NBA, System, Market Live) copied as-is, no prompts.
- `astro-starter` — minimal Astro app; the CLI prompts for extensions and sets them up.
- `astro-app` — full Astro demo (GitHub, NBA, System, Market Live) copied as-is, no prompts.
- `next-starter` — minimal Next.js app; the CLI prompts for extensions and sets them up.
- `next-app` — full Next.js demo (GitHub, NBA, System, Market Live) copied as-is, no prompts.
- `react-router-starter` — minimal React Router app; the CLI prompts for extensions and sets them up.
- `react-router-app` — full React Router demo (GitHub, NBA, System, Market Live) copied as-is, no prompts.
- `start-starter` — minimal TanStack Start app; the CLI prompts for extensions and sets them up.
- `start-app` — full TanStack Start demo (GitHub, NBA, System, Market Live) copied as-is, no prompts.

### `add` — Add an extension

```bash
npx dashfy@latest add [extensions...] [options]
```

Resolves the address(es), installs the `@getdashfy/ext-*` package(s), and sets them up automatically: registers widgets in the app file (`App.tsx`, or the file set in `dashfy.json` `paths.app`), registers the server API, seeds `.env`, appends starter blocks to `dashfy.config.yml`. With no arguments it fetches the catalog and prompts. `registryDependencies` are resolved and applied first.

| Flag           | Short | Description                                          | Default    |
| -------------- | ----- | ---------------------------------------------------- | ---------- |
| `--cwd <cwd>`  | `-c`  | Working directory                                    | current    |
| `--no-install` |       | Skip installing npm dependencies (set up only)       | install on |
| `--dry-run`    |       | Preview what would be added without writing anything | `false`    |
| `--yes`        | `-y`  | Accept defaults / skip prompts                       | `false`    |

Accepts: name (`github`), namespaced name (`@getdashfy/github`), URL (`https://…/foo.json`), local file (`./foo.json`), or GitHub address (`owner/repo/name[#ref]`). When you reference a namespace not in `dashfy.json`, `add` looks it up in the discovery index and offers to configure it (auto-added with `-y`).

### `remove` — Remove an extension

```bash
npx dashfy@latest remove [extensions...] [options]
```

Reverses what `add` set up: removes the widget registration + imports from `App.tsx`, the server registration, the starter dashboard, the env entries (**only empty placeholders**), and uninstalls the package. `rm` is an alias. With no arguments it detects installed extensions and prompts.

| Flag          | Short | Description                                           | Default |
| ------------- | ----- | ----------------------------------------------------- | ------- |
| `--cwd <cwd>` | `-c`  | Working directory                                     | current |
| `--keep-deps` |       | Leave npm dependencies installed (setup-only removal) | `false` |
| `--dry-run`   |       | Preview what would be removed without writing         | `false` |
| `--yes`       | `-y`  | Skip the confirmation prompt                          | `false` |

Removal is registry-first; if the registry is unreachable it derives the setup from the project (env cleanup is skipped offline). Every step is idempotent.

### `search` — Search registries

```bash
npx dashfy@latest search [registries...] [options]
```

Fuzzy-searches extension catalogs and prints matches with a ready-to-run add command. `list` is an alias. With no arguments it searches every configured registry (including built-in `@getdashfy`).

| Flag                | Short | Description                                                 | Default |
| ------------------- | ----- | ----------------------------------------------------------- | ------- |
| `--query <query>`   | `-q`  | Filter by name, title, description, or category             | —       |
| `--type <type>`     | `-t`  | Filter by item type (comma-separated; `registry:extension`) | —       |
| `--limit <number>`  | `-l`  | Max items per registry                                      | `100`   |
| `--offset <number>` | `-o`  | Items to skip                                               | `0`     |
| `--cwd <cwd>`       | `-c`  | Working directory                                           | current |
| `--json`            |       | Output as JSON                                              | `false` |

### `view` — View item details

```bash
npx dashfy@latest view <items...> [options]
```

Resolves the address(es) and prints the full registry item JSON (deps, env vars, widgets, starter config). Useful for piping: `npx dashfy@latest view @getdashfy/github | jq '.dependencies'`.

| Flag          | Short | Description       | Default |
| ------------- | ----- | ----------------- | ------- |
| `--cwd <cwd>` | `-c`  | Working directory | current |

### `docs` — Extension setup docs

```bash
npx dashfy@latest docs <extensions...> [options]
```

Resolves the extension(s) and prints setup-oriented documentation: the author's setup notes (`docs` field), required env vars, how it integrates into the app/server, the starter dashboard, and a runner-aware install command. Unlike `view` (raw JSON), `docs` is formatted for reading.

| Flag          | Short | Description       | Default |
| ------------- | ----- | ----------------- | ------- |
| `--cwd <cwd>` | `-c`  | Working directory | current |
| `--json`      |       | Output as JSON    | `false` |

### `info` — Project snapshot

```bash
npx dashfy@latest info [options]
```

Prints detected files, `dashfy.json` paths, configured registries, installed `ext-*` packages, and useful links. Run this first to understand the project.

| Flag          | Short | Description       | Default |
| ------------- | ----- | ----------------- | ------- |
| `--cwd <cwd>` | `-c`  | Working directory | current |
| `--json`      |       | Output as JSON    | `false` |

### `doctor` — Audit the project

```bash
npx dashfy@latest doctor [extensions...] [options]
```

Verifies each extension is fully set up: package installed, widgets registered via `WidgetRegistry.addExtension`, server API registered via `dashfy.registerApi` (when it has a client), required env vars set, and starter block present. The CLI counterpart of the MCP `get_audit_checklist` tool. With no arguments it auto-detects installed extensions. Each check reports pass/fail/warning/skip; **exits non-zero on any failure** (CI gate). Falls back to source inspection when the registry is unreachable.

| Flag          | Short | Description       | Default |
| ------------- | ----- | ----------------- | ------- |
| `--cwd <cwd>` | `-c`  | Working directory | current |
| `--json`      |       | Output as JSON    | `false` |

---

## Registry commands

### `registry build` — Build hosted artifacts

```bash
npx dashfy@latest registry build [packages] [options]
```

Reads the `dashfy` metadata field of each `ext-*` package and emits `<name>.json` per extension plus `index.json`.

| Flag              | Short | Description                           | Default                  |
| ----------------- | ----- | ------------------------------------- | ------------------------ |
| `[packages]`      |       | Directory containing `ext-*` packages | `./packages`             |
| `--output <path>` | `-o`  | Destination directory                 | `apps/registry/public/r` |
| `--cwd <cwd>`     | `-c`  | Working directory                     | current                  |

### `registry validate` — Validate a built registry

```bash
npx dashfy@latest registry validate [dir] [options]
```

Checks that `index.json` and every `<name>.json` match the schemas, filenames match item names, there are no duplicate names, the index is in sync with the item files, and local `registryDependencies` resolve within the same registry. Exits non-zero on failure.

| Flag                  | Short | Description                                      | Default                  |
| --------------------- | ----- | ------------------------------------------------ | ------------------------ |
| `[dir]`               |       | Directory with the built registry                | `apps/registry/public/r` |
| `--registries <path>` |       | Also validate a `registries.json` discovery file | —                        |
| `--cwd <cwd>`         | `-c`  | Working directory                                | current                  |
| `--json`              |       | Output the full report as JSON                   | `false`                  |

### `registry add` — Add a custom registry

```bash
npx dashfy@latest registry add [registries...] [options]
```

Adds custom registries to `dashfy.json` (merged over built-in `@getdashfy`). Accepts a bare `@namespace` (resolved from the discovery index) or an explicit `@namespace=https://host/r/{name}.json` (must contain `{name}`). With no arguments it lists known registries for interactive selection.

| Flag          | Short | Description               | Default |
| ------------- | ----- | ------------------------- | ------- |
| `--cwd <cwd>` | `-c`  | Working directory         | current |
| `--yes`       | `-y`  | Skip confirmation prompts | `false` |
| `--silent`    | `-s`  | Mute output               | `false` |

### `registry remove` — Remove a custom registry

```bash
npx dashfy@latest registry remove [registries...] [options]
```

Removes custom registries from `dashfy.json` — the inverse of `registry add`. The built-in `@getdashfy` namespace is implicit and cannot be removed. With no arguments it lists configured registries for interactive multiselect.

| Flag          | Short | Description               | Default |
| ------------- | ----- | ------------------------- | ------- |
| `--cwd <cwd>` | `-c`  | Working directory         | current |
| `--yes`       | `-y`  | Skip confirmation prompts | `false` |
| `--silent`    | `-s`  | Mute output               | `false` |

---

## MCP commands

### `mcp` — Run the MCP server

```bash
npx dashfy@latest mcp [options]
```

Runs the Model Context Protocol server over stdio so AI assistants can discover and install extensions. See [mcp.md](./mcp.md) for the tools.

| Flag          | Short | Description       | Default |
| ------------- | ----- | ----------------- | ------- |
| `--cwd <cwd>` | `-c`  | Working directory | current |

### `mcp init` — Configure an MCP client

```bash
npx dashfy@latest mcp init [options]
```

Writes the client configuration that points to `npx dashfy@latest mcp`. With no `--client`, prompts for selection.

| Flag                | Description                                                                           |
| ------------------- | ------------------------------------------------------------------------------------- |
| `--client <client>` | `cursor`, `claude`, `vscode`, `codex`, or `opencode`                                  |
| `--install`         | Install `dashfy` as a pinned exact devDependency and point config at the local binary |

| Client   | File written                                    | Container key |
| -------- | ----------------------------------------------- | ------------- |
| Cursor   | `.cursor/mcp.json`                              | `mcpServers`  |
| Claude   | `.mcp.json`                                     | `mcpServers`  |
| VS Code  | `.vscode/mcp.json`                              | `servers`     |
| OpenCode | `opencode.json`                                 | `mcp` (local) |
| Codex    | _none_ (prints TOML for `~/.codex/config.toml`) | —             |

Existing config files are preserved; only the `dashfy` server entry is merged in.

---

## Templates

| Value                  | Description                                                                | Prompts |
| ---------------------- | -------------------------------------------------------------------------- | ------- |
| `vite-starter`         | Minimal Vite app; CLI prompts for extensions and sets them up (default).   | Yes     |
| `vite-app`             | Full Vite demo (GitHub, NBA, System, Market Live), copied as-is.           | No      |
| `astro-starter`        | Minimal Astro app; CLI prompts for extensions and sets them up.            | Yes     |
| `astro-app`            | Full Astro demo (GitHub, NBA, System, Market Live), copied as-is.          | No      |
| `next-starter`         | Minimal Next.js app; CLI prompts for extensions and sets them up.          | Yes     |
| `next-app`             | Full Next.js demo (GitHub, NBA, System, Market Live), copied as-is.        | No      |
| `react-router-starter` | Minimal React Router app; CLI prompts for extensions and sets them up.     | Yes     |
| `react-router-app`     | Full React Router demo (GitHub, NBA, System, Market Live), copied as-is.   | No      |
| `start-starter`        | Minimal TanStack Start app; CLI prompts for extensions and sets them up.   | Yes     |
| `start-app`            | Full TanStack Start demo (GitHub, NBA, System, Market Live), copied as-is. | No      |

By default `init` fetches the template via a sparse `git` checkout. Set `DASHFY_TEMPLATE_DIR` to scaffold from a local checkout (offline), and `DASHFY_GITHUB_URL` to override the source repository.

---

## Package runner

Commands Dashfy suggests for copy-pasting (the add command in `search`, the Install line in `docs`, and MCP output) are prefixed with the runner for the detected package manager:

| Package manager | Suggested command                              |
| --------------- | ---------------------------------------------- |
| pnpm            | `pnpm dlx dashfy@latest add @getdashfy/github` |
| bun             | `bunx dashfy@latest add @getdashfy/github`     |
| npm / yarn      | `npx dashfy@latest add @getdashfy/github`      |

Detection follows `npm_config_user_agent` first, then a lockfile in the working directory, falling back to npm.

---

## Environment variables

`init`, `add`, and `registry add` automatically load `.env` files before resolving registries, in precedence order (first match wins; existing process env is never overridden):

```
.env.local
.env.development.local
.env.development
.env
```

This makes `${ENV_VAR}` placeholders in a custom registry's `url` / `params` / `headers` resolvable for private registries.

Other tunables:

- `DASHFY_REGISTRY_URL` — base URL/dir for `@getdashfy` items (offline/dev).
- `DASHFY_REGISTRIES_URL` — location of the discovery index (`registries.json`).
- `DASHFY_TEMPLATE_DIR` / `DASHFY_GITHUB_URL` — template source for `init`.
