# `dashfy`

> Dashfy CLI - scaffold dashboards and add extensions.

The `dashfy` CLI helps you create a new Dashfy project and add extensions (widgets + data sources) to an existing one, the dashboards analog of `shadcn add`.

## Usage

Scaffold a new project (minimal starter, choose extensions interactively):

```bash
npx dashfy@latest init
```

Scaffold the full pre-configured demo:

```bash
npx dashfy@latest init -t vite-app
```

Add an extension to an existing Dashfy project:

```bash
npx dashfy@latest add @getdashfy/github
```

## How it works

Extensions are resolved from a **registry** at runtime over HTTP, the same model as
[shadcn-ui](https://ui.shadcn.com/docs/registry). The default registry is the `@getdashfy` namespace, served from
`https://registry.dashfy.dev/r`. The difference from shadcn: a Dashfy registry item
describes an npm package plus setup metadata, so "applying" an extension means
_installing_ the package and running codemods, rather than copying source files.

You reference extensions by **address**:

| Address                          | Resolves to                                              |
| -------------------------------- | -------------------------------------------------------- |
| `github`                         | the `@getdashfy` namespace (default) → `…/r/github.json` |
| `@getdashfy/github`              | the `@getdashfy` namespace explicitly                    |
| `@acme/widget`                   | a custom namespace declared in `dashfy.json`             |
| `https://example.com/r/foo.json` | a direct URL                                             |
| `./local/foo.json`               | a local registry file                                    |
| `owner/repo/foo`                 | a registry item in a GitHub repo (`#ref` optional)       |

## Commands

### `dashfy init|create [name]`

Scaffolds a runnable Dashfy app (a framework client + Node server + configuration). Templates are fetched at runtime from the Dashfy repo (no template is bundled in the published CLI).

`create` is an alias for `init`, so `npx dashfy@latest create my-app -t vite-app` is equivalent to `npx dashfy@latest init my-app -t vite-app`.

Options:

- `-t, --template <template>` — template to use. Available:
  - `vite-starter` (default) — minimal Vite app; the CLI prompts you for extensions and sets them up.
  - `vite-app` — full Vite demo (GitHub, System, Market Live) copied as-is, no prompts.
  - `astro-starter` — minimal Astro app; the CLI prompts you for extensions and sets them up.
  - `astro-app` — full Astro demo (GitHub, System, Market Live) copied as-is, no prompts.
  - `next-starter` — minimal Next.js app; the CLI prompts you for extensions and sets them up.
  - `next-app` — full Next.js demo (GitHub, System, Market Live) copied as-is, no prompts.
  - `react-router-starter` — minimal React Router app; the CLI prompts you for extensions and sets them up.
  - `react-router-app` — full React Router demo (GitHub, System, Market Live) copied as-is, no prompts.
  - `start-starter` — minimal TanStack Start app; the CLI prompts you for extensions and sets them up.
  - `start-app` — full TanStack Start demo (GitHub, System, Market Live) copied as-is, no prompts.
- `-e, --extensions <names>` — comma-separated extensions to set up (skips the prompt; `*-starter` only).
- `-c, --cwd <cwd>` — working directory.
- `--no-install` — skip installing npm dependencies.
- `-y, --yes` — accept defaults / skip prompts.

#### Local template development

By default, `init` fetches the chosen template via a sparse `git` checkout. Set `DASHFY_TEMPLATE_DIR` to scaffold from a local checkout instead (offline, no git):

```bash
DASHFY_TEMPLATE_DIR="/path/to/dashfy/templates" dashfy init demo -t vite-app --no-install
```

You can also override the source repository with `DASHFY_GITHUB_URL` (defaults to `https://github.com/dashfy/dashfy.git`).

### `dashfy add [extensions...]`

Resolves the given extension address(es) from the registry, installs the
`@getdashfy/ext-*` npm package(s), and sets them up automatically:

- registers widgets in your `App.tsx` via `WidgetRegistry.addExtension`
- registers the server API in your server bootstrap via `dashfy.registerApi`
- adds required environment variables to `.env`
- appends starter widget blocks to your `dashfy.config.yml`

With no arguments, `add` fetches the catalog index and prompts you to pick.
`registryDependencies` declared by an item are resolved and applied first.

When you reference a namespace that is not in your `dashfy.json` (e.g.
`dashfy add @acme/widget`), `add` looks it up in the hosted
[discovery index](#discovery-index-registriesjson) and offers to configure it for
you (auto-added with `-y`). Unknown namespaces still produce a helpful error.

Before resolving, `add` loads `.env` files from the working directory (see
[Environment variables](#environment-variables)) so `${ENV_VAR}` auth in custom
registries works.

Options:

- `-c, --cwd <cwd>` — working directory.
- `--no-install` — skip installing npm dependencies (set up only).
- `--dry-run` — print what would be added without writing anything.
- `-y, --yes` — accept defaults / skip prompts.

### `dashfy remove [extensions...]`

Reverses what `add` set up. For each extension it:

- removes the `WidgetRegistry.addExtension` registration and widget imports from `App.tsx`
- removes the `dashfy.registerApi` registration and client import from your server bootstrap
- removes the starter dashboard it created from `dashfy.config.yml`
- removes the extension's `.env` entries — **only when they are still empty placeholders** (e.g. `GITHUB_TOKEN=`). Lines that hold a value are preserved and reported, so your secrets are never deleted.
- uninstalls the `@getdashfy/ext-*` npm package(s) (unless `--keep-deps`)

With no arguments, `remove` detects installed extensions from your `package.json`
and prompts you to pick. Removal is registry-first: it resolves each item to
reverse the exact setup. If the registry is unreachable, it falls back to
deriving the setup from your project so removal still works offline (env cleanup
is skipped in offline mode since the variable list can't be derived). Every step
is idempotent — removing an extension that isn't set up is a safe no-op.

Options:

- `-c, --cwd <cwd>` — working directory.
- `--keep-deps` — leave npm dependencies installed (setup-only removal).
- `--dry-run` — print what would be removed without writing anything.
- `-y, --yes` — skip the confirmation prompt.

### `dashfy search [registries...]`

Searches extension catalogs and prints matches. Aliased as `dashfy list`. With no
arguments it searches every registry configured in `dashfy.json` (including the
built-in `@getdashfy`); pass `@namespace`(s) to search specific ones. Queries are
fuzzy-matched (and ranked) across name, title, description, and categories, each
result includes a ready-to-run add command, and a pagination hint is
shown when more matches remain (use `--offset` to page through them).

The suggested add command adapts to your project's package manager (see
[Package runner](#package-runner)), e.g. `pnpm dlx dashfy@latest add @getdashfy/github`.

```bash
# search everything, filter by query
npx dashfy@latest search --query git

# search a specific registry as JSON
npx dashfy@latest search @getdashfy --json
```

Options:

- `[registries...]` — registry namespace(s) to search (defaults to all configured).
- `-c, --cwd <cwd>` — working directory.
- `-q, --query <query>` — filter by name, title, description, or category.
- `-t, --type <type>` — filter by item type (comma-separated; currently `registry:extension`).
- `-l, --limit <number>` — max items per registry (default `100`).
- `-o, --offset <number>` — items to skip (default `0`).
- `--json` — output as JSON.

### `dashfy view <items...>`

Resolves the given address(es) and prints the full registry item JSON (deps,
env vars, widgets, starter config). Useful for inspection and piping:

```bash
npx dashfy@latest view @getdashfy/github | jq '.dependencies'
```

Options:

- `<items...>` — item address(es): name, `@namespace/name`, url, or `owner/repo/name`.
- `-c, --cwd <cwd>` — working directory.

### `dashfy docs <extensions...>`

Resolves the given extension(s) and prints setup-oriented documentation: the
author's setup notes (from the registry item's `docs` field), required
environment variables, how the extension integrates into your app and server, the
starter dashboard it seeds, and a ready-to-run install command. Unlike `view`
(which dumps raw JSON), `docs` is formatted for reading.

```bash
dashfy docs github
dashfy docs @getdashfy/github --json
```

The `docs` field is authored in each extension's `package.json` under
`dashfy.docs` and copied into the registry item by `dashfy registry build`, so
only extensions that declare it (e.g. GitHub) show a Setup section. The Install
command adapts to your package manager (see [Package runner](#package-runner)).
The same output is available to AI assistants via the MCP `get_docs_for_items`
tool.

Options:

- `<extensions...>` — extension address(es): name, `@namespace/name`, url, or `owner/repo/name`.
- `-c, --cwd <cwd>` — working directory.
- `--json` — output as JSON.

### Package runner

Commands that Dashfy suggests for copy-pasting (the inline add command in
`dashfy search`, the Install line in `dashfy docs`, and the MCP
`search_items_in_registries` / `get_add_command_for_items` output) are prefixed
with the runner for your project's detected package manager, so they work as-is
in monorepos:

| Package manager | Suggested command                              |
| --------------- | ---------------------------------------------- |
| pnpm            | `pnpm dlx dashfy@latest add @getdashfy/github` |
| bun             | `bunx dashfy@latest add @getdashfy/github`     |
| npm / yarn      | `npx dashfy@latest add @getdashfy/github`      |

Detection follows the same logic as installs: the `npm_config_user_agent` of the
running process first, then a lockfile in the working directory, falling back to
npm.

### `dashfy info`

Prints a snapshot of the current project: detected files, `dashfy.json` paths,
configured registries, installed `ext-*` packages, and useful links.

```bash
npx dashfy@latest info
npx dashfy@latest info --json
```

Options:

- `-c, --cwd <cwd>` — working directory.
- `--json` — output as JSON.

### `dashfy doctor [extensions...]`

Diagnoses the current project and verifies that each extension is fully set up:
its npm dependency is installed, its widgets are registered via
`WidgetRegistry.addExtension(...)`, its server API is registered via
`dashfy.registerApi(...)` (when it has a client), its required env vars are set,
and its starter dashboard block exists. It is the CLI counterpart of the MCP
`get_audit_checklist` tool — the same project-aware audit, surfaced for humans
and CI.

```bash
npx dashfy@latest doctor              # auto-detect installed extensions
npx dashfy@latest doctor @getdashfy/github  # scope to specific extension(s)
npx dashfy@latest doctor --json       # machine-readable report for CI
```

With no arguments, `doctor` auto-detects installed extensions from
`package.json`. Each check is reported as pass, fail, warning (advisory, e.g. a
missing starter block), or skip (manual reminders). When the registry is
unreachable it falls back to inspecting the project's source files, so it still
works offline.

`doctor` exits with a non-zero status code when any check fails, making it
suitable as a CI gate. Warnings and skips do not fail the run.

Options:

- `[extensions...]` — limit checks to specific extension address(es).
- `-c, --cwd <cwd>` — working directory.
- `--json` — output as JSON.

## Global flags

These apply to every command:

- `--json` — emit machine-readable JSON only and suppress human output (spinners,
  status lines). Errors are printed to stderr as a structured `{ "error", "message" }`
  object. Place before the command (e.g. `dashfy --json add @getdashfy/github`);
  `info`, `search`, `view`, `docs`, and `doctor` also accept `--json` after the command.
- `--silent` — mute non-error output.

## Project configuration (`dashfy.json`)

`dashfy init` writes a `dashfy.json` to the scaffolded project, and `add` reads it.
It declares where the CLI applies changes and any custom registries:

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

- `registries` are merged over the built-in `@getdashfy` namespace, so you can add
  third-party sources or override the default. A registry endpoint is a URL
  template containing `{name}`, or an object with `url` plus optional `params` /
  `headers` (values may reference `${ENV_VAR}` for auth).
- `paths` take precedence over the CLI's heuristic file discovery.

## Custom & third-party registries

Anyone can publish a registry: serve `<name>.json` files (validating against
[`registry-item.json`](https://dashfy.dev/schema/registry-item.json)) plus an
`index.json` catalog at a public URL, declare the namespace in `dashfy.json`, and
install with `dashfy add @yourscope/widget`. Items can also live in a GitHub repo
(under `r/<name>.json`) and be installed with `dashfy add owner/repo/widget`.

### `dashfy registry add [registries...]`

Adds custom registries to your `dashfy.json` (merged over the built-in
`@getdashfy`). Accepts either a bare namespace resolved from the discovery index, or
an explicit `namespace=url` pair:

```bash
# resolve @acme from the hosted discovery index
npx dashfy@latest registry add @acme

# declare a namespace with an explicit URL template (must contain {name})
npx dashfy@latest registry add @acme=https://acme.com/r/{name}.json
```

With no arguments it lists known registries from the discovery index for
interactive selection (falling back to manual entry if the index is
unavailable). Namespaces already configured are skipped.

Options:

- `[registries...]` — `@namespace` or `@namespace=https://host/r/{name}.json`.
- `-c, --cwd <cwd>` — working directory.
- `-y, --yes` — skip confirmation prompts.
- `-s, --silent` — mute output.

### `dashfy registry remove [registries...]`

Removes custom registries from your `dashfy.json` — the inverse of
`registry add`. Accepts one or more `@namespace` arguments:

```bash
npx dashfy@latest registry remove @acme
npx dashfy@latest registry remove @acme @beta -y
```

With no arguments it lists the registries configured in `dashfy.json` for
interactive multiselect. Removing a namespace that is not configured is a safe
no-op. The built-in `@getdashfy` namespace is implicit (never written to the file),
so it cannot be removed. When the last custom registry is removed, the
`registries` key is dropped entirely to keep the file tidy.

Options:

- `[registries...]` — `@namespace`(s) to remove.
- `-c, --cwd <cwd>` — working directory.
- `-y, --yes` — skip confirmation prompts.
- `-s, --silent` — mute output.

### Discovery index (`registries.json`)

The CLI resolves bare namespaces (in `registry add` and in `add`'s auto-config
flow) from a hosted discovery index served at
`https://registry.dashfy.dev/registries.json`. It maps each public `@namespace`
to its URL template plus optional `name`, `description`, and `homepage`. To list a
community registry, open a PR adding it to
[`apps/registry/public/registries.json`](../../apps/registry/public/registries.json).

Override the index location with `DASHFY_REGISTRIES_URL` (a URL or a local
directory/file) for offline work or testing, the discovery analog of
`DASHFY_REGISTRY_URL`.

### `dashfy registry:build [packages]`

Builds the hosted registry artifacts (`<name>.json` per extension + `index.json`)
from the `dashfy` metadata field of each `ext-*` package. Used to produce the files
served at `registry.dashfy.dev`.

Options:

- `[packages]` — directory containing the `ext-*` packages (default `./packages`).
- `-o, --output <path>` — destination directory (default `apps/registry/public/r`).
- `-c, --cwd <cwd>` — working directory.

### `dashfy registry validate [dir]`

Validates a built registry directory before you publish it: it checks that
`index.json` and every `<name>.json` match the registry schemas, that filenames
match item names, that there are no duplicate names, that `index.json` is in sync
with the item files, and that local `registryDependencies` resolve to items in
the same registry. Remote dependencies (url/GitHub) are skipped.

```bash
# build then validate the output
npx dashfy@latest registry build && npx dashfy@latest registry validate

# validate a custom directory and a discovery file, JSON output for CI
npx dashfy@latest registry validate ./public/r --registries ./public/registries.json --json
```

Exits non-zero when validation fails, printing grouped diagnostics per file.

Options:

- `[dir]` — directory with the built registry (default `apps/registry/public/r`).
- `-c, --cwd <cwd>` — working directory.
- `--registries <path>` — also validate a `registries.json` discovery file.
- `--json` — output the full report as JSON.

## MCP server

`dashfy mcp` runs a [Model Context Protocol](https://modelcontextprotocol.io)
server over stdio so AI assistants (Cursor, Claude, VS Code, Codex, OpenCode) can
discover and install Dashfy extensions. It exposes these tools:

| Tool                         | Description                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `get_project_registries`     | List the registries configured for the project (plus built-in @getdashfy).                                     |
| `list_items_in_registries`   | List extensions across registries (filter by `types`, paginate).                                               |
| `search_items_in_registries` | Fuzzy-search extensions by text query (ranked, paginated; runner-aware add command).                           |
| `view_items_in_registries`   | Full details for one or more extensions (deps, env vars, setup).                                               |
| `get_docs_for_items`         | Setup-oriented docs (env, setup, starter blocks, runner-aware install command). CLI equivalent: `dashfy docs`. |
| `get_add_command_for_items`  | The add command (and variants) for the given extensions, prefixed with the project's package runner.           |
| `get_audit_checklist`        | Project-aware post-install checklist (env vars, server setup, starters).                                       |

Tool output is plain text, and the server uses stdout for the protocol, so it
never logs to stdout.

### `dashfy mcp init [--client <client>] [--install]`

Writes the client configuration that points to `npx dashfy@latest mcp`. With no
`--client`, it prompts you to select one or more.

```bash
npx dashfy@latest mcp init --client cursor
```

| Client   | File written       | Notes                                  |
| -------- | ------------------ | -------------------------------------- |
| Cursor   | `.cursor/mcp.json` | `mcpServers.dashfy`                    |
| Claude   | `.mcp.json`        | `mcpServers.dashfy`                    |
| VS Code  | `.vscode/mcp.json` | `servers.dashfy`                       |
| OpenCode | `opencode.json`    | `mcp.dashfy` (local)                   |
| Codex    | _none_             | prints TOML for `~/.codex/config.toml` |

Existing config files are preserved; only the `dashfy` server entry is merged in.

Pass `--install` to pin the CLI: it installs `dashfy` as an exact devDependency
(using your detected package manager) and points the MCP config at the local
binary (`npx dashfy mcp`) instead of `npx dashfy@latest mcp`. This is useful for
monorepos and teams that want a locked CLI version.

```bash
npx dashfy@latest mcp init --client cursor --install
```

Options:

- `-c, --cwd <cwd>` — working directory (on the `mcp` command).
- `--client <client>` — `cursor`, `claude`, `vscode`, `codex`, or `opencode`.
- `--install` — install `dashfy` as a pinned devDependency and use the local CLI.

## Offline / local development

`add` reaches the network by default. Override the registry base with
`DASHFY_REGISTRY_URL` (a URL or a local directory) for offline work, CI, or testing,
the registry analog of `DASHFY_TEMPLATE_DIR`:

```bash
DASHFY_REGISTRY_URL="/path/to/apps/registry/public/r" dashfy add @getdashfy/github --no-install
```

## Environment variables

`init`, `add`, and `registry add` automatically load `.env` files from the
working directory before resolving registries, in this precedence order (first
match wins, existing process env is never overridden):

```
.env.local
.env.development.local
.env.development
.env
```

This makes `${ENV_VAR}` placeholders in a custom registry's `url` / `params` /
`headers` resolvable for private/authenticated registries, e.g.:

```jsonc
{
  "registries": {
    "@acme": {
      "url": "https://acme.com/r/{name}.json",
      "headers": { "Authorization": "Bearer ${ACME_TOKEN}" },
    },
  },
}
```

with `ACME_TOKEN=...` in your `.env`.

CLI behavior can also be tuned with:

- `DASHFY_REGISTRY_URL` — base URL/dir for `@getdashfy` items (offline/dev).
- `DASHFY_REGISTRIES_URL` — location of the discovery index (`registries.json`).
- `DASHFY_TEMPLATE_DIR` / `DASHFY_GITHUB_URL` — template source for `init`.

## Community

Join the community on [Dashfy's Discord server](https://dashfy.dev/discord) to discuss the project, ask questions, or get help.

Join the conversation on X (Twitter) and follow [@dashfydev](https://x.com/dashfydev) for updates and announcements.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
