---
name: dashfy
description: Manages Dashfy dashboards and extensions — scaffolding apps, adding/removing extensions, setting up widgets + data sources, laying out dashboards, authoring registries, and MCP. Provides project context, extension docs, and config patterns. Applies when working with Dashfy, dashboard widgets, extension registries, or any project with a dashfy.json / dashfy.config.yml. Also triggers for "dashfy init", "dashfy add", or "build a dashboard".
user-invocable: false
allowed-tools: Bash(npx dashfy@latest *), Bash(pnpm dlx dashfy@latest *), Bash(bunx dashfy@latest *)
---

# Dashfy

A framework for building dashboards from composable **extensions** (widgets + data sources). Extensions are resolved from a **registry** over HTTP — the dashboards analog of `shadcn add`. The difference: a Dashfy registry item describes an npm package plus setup metadata, so "adding" an extension means _installing_ the package and running codemods, rather than copying source files.

> **IMPORTANT:** Run all CLI commands using the project's package runner: `npx dashfy@latest`, `pnpm dlx dashfy@latest`, or `bunx dashfy@latest` — based on the project's detected package manager. Examples below use `npx dashfy@latest` but substitute the correct runner for the project.

## Current Project Context

```json
!`npx dashfy@latest info --json`
```

The JSON above contains the detected project files, `dashfy.json` paths, configured registries, and installed `ext-*` packages. Use `npx dashfy@latest docs <extension>` to get setup-oriented documentation for any extension.

## Principles

1. **Resolve from the registry first.** Use `npx dashfy@latest search` to find an extension before assuming one exists. Check configured registries too.
2. **Never set up by hand — let the CLI codemod.** Adding an extension edits `App.tsx`, the server bootstrap, `.env`, and `dashfy.config.yml`. Use `dashfy add`/`dashfy remove`, not manual edits. → [rules/setup-lifecycle.md](./rules/setup-lifecycle.md)
3. **Compose dashboards from widgets.** A dashboard is a grid of widget blocks in `dashfy.config.yml`. Only reference widgets an installed extension actually registers. → [config.md](./config.md)
4. **Verify with `doctor`.** After adding, run `npx dashfy@latest doctor` to confirm setup, env vars, and starter blocks.

## Critical Rules

These rules are **always enforced**. Each links to a file with Incorrect/Correct pairs.

### Setup & Lifecycle → [rules/setup-lifecycle.md](./rules/setup-lifecycle.md)

- **Use `dashfy add` / `dashfy remove`, never manual setup.** The CLI registers widgets in `App.tsx` via `WidgetRegistry.addExtension`, registers the server via `dashfy.registerApi`, seeds `.env`, and appends starter blocks to the config.
- **All setup is idempotent.** Re-adding an installed extension is a safe no-op; removing one that isn't set up is too.
- **Never delete secrets.** `remove` only strips empty `KEY=` placeholders from `.env`; lines holding a value are preserved.
- **`add` seeds env vars as empty placeholders.** Fill them in `.env` afterward; never commit real tokens.

### Dashboard Layout → [rules/layout.md](./rules/layout.md)

- **Every widget needs `extension`, `widget`, `x`, `y`, `columns`, `rows`.** Plus any widget-specific props (passthrough).
- **Stay inside the grid.** `x + columns <= dashboard.columns` and `y + rows <= dashboard.rows`; all values `>= 1` (x/y `>= 0`).
- **No overlaps.** Two widgets must not occupy the same cell.
- **Only reference registered widgets.** The `widget` value must be an export listed in the extension's `widgets[]`.

### Addresses → [rules/addresses.md](./rules/addresses.md)

- **Classify the address before resolving.** Bare `github` → `@dashfy`; `@ns/name` → namespace; `owner/repo/name[#ref]` → GitHub; `https://…/foo.json` → URL; `./foo.json` → local file.
- **Bare names mean `@dashfy`, never same-repo.** They are not relative references.

### Extension Authoring → [rules/extension-authoring.md](./rules/extension-authoring.md)

- **Author the `dashfy` field in the package's `package.json`.** `id`, `title`, `widgets[]`, optional `client`, `envVars[]`, `starter[]`, `categories`, `docs`.
- **Browser-only extensions omit `client`.** e.g. `market-live` has no server data source.
- **`widgets[]` must match real exports.** Every listed name must be an actual exported component.
- **Build before publishing.** `dashfy registry build` turns package metadata into `<name>.json` + `index.json`; `dashfy registry validate` checks them.

## Key Patterns

These are the most common patterns that differentiate correct Dashfy usage.

```yaml
# Dashboard widget block: extension + widget + grid coords + props.
- extension: github
  widget: RepoBadge
  x: 0
  y: 0
  columns: 1
  rows: 1
  repository: vercel/next.js
```

```jsonc
// Extension metadata: the `dashfy` field in an ext package.json.
"dashfy": {
  "id": "github",
  "title": "GitHub",
  "categories": ["developer"],
  "docs": "Create a token at https://github.com/settings/tokens",
  "widgets": ["UserBadge", "RepoBadge", "PullRequests"],
  "client": {
    "import": "@dashfy/ext-github",
    "factory": "createGitHubClient",
    "mode": "poll",
    "options": "{ token: process.env.GITHUB_TOKEN! }"
  },
  "envVars": ["GITHUB_TOKEN"],
  "starter": [{ "widget": "RepoBadge", "repository": "facebook/react" }]
}
```

```bash
# Add an extension (installs the package + sets everything up).
npx dashfy@latest add @dashfy/github

# Preview without writing.
npx dashfy@latest add @dashfy/github --dry-run

# Verify the project after adding.
npx dashfy@latest doctor
```

## Command Selection

| Need                                     | Use                                              |
| ---------------------------------------- | ------------------------------------------------ |
| Scaffold a new dashboard app             | `dashfy init` (alias `create`)                   |
| Add an extension (install + set up)      | `dashfy add <address>`                           |
| Remove an extension (remove + uninstall) | `dashfy remove <address>` (alias `rm`)           |
| Find an extension                        | `dashfy search` (alias `list`)                   |
| Inspect raw registry item JSON           | `dashfy view <address>`                          |
| Read setup docs for an extension         | `dashfy docs <extension>`                        |
| See project snapshot                     | `dashfy info`                                    |
| Audit setup / env / starters (CI gate)   | `dashfy doctor`                                  |
| Build hosted registry artifacts          | `dashfy registry build`                          |
| Validate a built registry                | `dashfy registry validate`                       |
| Add / remove a custom registry namespace | `dashfy registry add` / `dashfy registry remove` |
| Run the MCP server / configure a client  | `dashfy mcp` / `dashfy mcp init`                 |

See [cli.md](./cli.md) for every command, flag, and example.

## MCP Tools

The CLI ships an MCP server (`dashfy mcp`) so AI assistants can discover and install extensions. Tools:

| Tool                         | Description                                                               |
| ---------------------------- | ------------------------------------------------------------------------- |
| `get_project_registries`     | List registries configured for the project (plus built-in `@dashfy`).     |
| `list_items_in_registries`   | List extensions across registries (filter by `types`, paginate).          |
| `search_items_in_registries` | Fuzzy-search extensions by text query (ranked; runner-aware add command). |
| `view_items_in_registries`   | Full details for one or more extensions (deps, env vars, setup).          |
| `get_docs_for_items`         | Setup-oriented docs (env, setup, starters, install command).              |
| `get_add_command_for_items`  | The runner-prefixed add command for given extensions.                     |
| `get_audit_checklist`        | Project-aware post-install checklist (env, server setup, starters).       |

See [mcp.md](./mcp.md) for setup and tool inputs.

## Workflow

1. **Get project context** — already injected above. Run `npx dashfy@latest info` to refresh.
2. **Check installed extensions first** — before `add`, look at the `ext-*` packages in project context. Don't re-add an extension that's already set up (it's a no-op, but check first).
3. **Find extensions** — `npx dashfy@latest search` (or the `search_items_in_registries` MCP tool).
4. **Read docs** — `npx dashfy@latest docs <extension>` for required env vars and setup notes.
5. **Preview** — `npx dashfy@latest add <address> --dry-run` to see deps and env before writing.
6. **Add** — `npx dashfy@latest add <address>`. `registryDependencies` are resolved and applied first.
7. **Configure** — set the seeded `.env` placeholders; lay out widgets in `dashfy.config.yml` following [rules/layout.md](./rules/layout.md).
8. **Verify** — `npx dashfy@latest doctor` (exits non-zero on failures; CI-friendly).
9. **Registry must be explicit** — when the user references a namespace not in `dashfy.json`, `add` offers to configure it from the discovery index. Don't guess a registry on the user's behalf.

## Quick Reference

```bash
# Scaffold a new project.
npx dashfy@latest init                        # minimal starter, prompts for extensions
npx dashfy@latest init my-app -t vite-app     # full pre-configured Vite demo
npx dashfy@latest init my-app -t astro-app    # full pre-configured Astro demo
npx dashfy@latest init my-app -t next-app     # full pre-configured Next.js demo
npx dashfy@latest init my-app -t react-router-app  # full pre-configured React Router demo
npx dashfy@latest init my-app -t start-app    # full pre-configured TanStack Start demo
npx dashfy@latest init my-app -e github,nba   # set up specific extensions (*-starter)

# Add / remove extensions.
npx dashfy@latest add @dashfy/github
npx dashfy@latest add github nba --dry-run
npx dashfy@latest add owner/repo/widget
npx dashfy@latest remove @dashfy/github
npx dashfy@latest remove github --keep-deps

# Discover.
npx dashfy@latest search --query git
npx dashfy@latest search @dashfy --json
npx dashfy@latest view @dashfy/github
npx dashfy@latest docs github

# Inspect & audit.
npx dashfy@latest info
npx dashfy@latest doctor
npx dashfy@latest doctor @dashfy/github --json

# Registries.
npx dashfy@latest registry add @acme=https://acme.com/r/{name}.json
npx dashfy@latest registry remove @acme
npx dashfy@latest registry build
npx dashfy@latest registry validate

# MCP.
npx dashfy@latest mcp
npx dashfy@latest mcp init --client cursor
```

**Built-in namespace:** `@dashfy` (served from `https://registry.dashfy.dev/r`)
**Templates:** `vite-starter` (default, interactive), `vite-app` (full demo), `astro-starter` (interactive), `astro-app` (full demo), `next-starter` (interactive), `next-app` (full demo), `react-router-starter` (interactive), `react-router-app` (full demo), `start-starter` (interactive), `start-app` (full demo)
**Bundled extensions:** `github`, `json`, `nba`, `system`, `market-live`

## Detailed References

- [cli.md](./cli.md) — every command, flag, preset, and example
- [registry.md](./registry.md) — authoring registry items, addresses, `registryDependencies`, discovery index, GitHub registries
- [mcp.md](./mcp.md) — MCP server, tools, `mcp init` clients
- [config.md](./config.md) — `dashfy.json`, `dashfy.config.yml`, the widget grid, theming
- [rules/setup-lifecycle.md](./rules/setup-lifecycle.md) — how add/remove codemod the project; setup lifecycle; idempotency; env safety
- [rules/layout.md](./rules/layout.md) — dashboard grid rules (x/y/columns/rows, no overlap)
- [rules/addresses.md](./rules/addresses.md) — address scheme classification
- [rules/extension-authoring.md](./rules/extension-authoring.md) — the `dashfy` package metadata field
