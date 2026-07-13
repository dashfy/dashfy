# Dashfy MCP Server

The CLI includes an MCP server that lets AI assistants search, browse, view, and install Dashfy extensions, and audit a project.

---

## Setup

```bash
dashfy mcp        # start the MCP server (stdio)
dashfy mcp init   # write config for your editor
```

Editor config files written by `dashfy mcp init`:

| Editor   | Config file                                     | Container key |
| -------- | ----------------------------------------------- | ------------- |
| Cursor   | `.cursor/mcp.json`                              | `mcpServers`  |
| Claude   | `.mcp.json`                                     | `mcpServers`  |
| VS Code  | `.vscode/mcp.json`                              | `servers`     |
| OpenCode | `opencode.json`                                 | `mcp` (local) |
| Codex    | _none_ (prints TOML for `~/.codex/config.toml`) | —             |

By default clients launch the server via `npx dashfy@latest mcp`. Pass `--install` to pin the CLI as an exact devDependency and point the config at the local `dashfy` binary instead — useful for monorepos and teams that want a locked version.

The server uses stdout for the protocol, so it never logs to stdout (tool output is plain text).

---

## Tools

> **Tip:** MCP tools handle registry operations (search, view, docs, install command, audit). For project configuration (paths, registries, installed extensions), use `npx dashfy@latest info` — there is no MCP equivalent.

### `get_project_registries`

Returns the registries configured for the project, including the built-in `@dashfy`.

**Input:** none

### `list_items_in_registries`

Lists all extensions from one or more registries. Omit `registries` to list from every configured registry.

**Input:** `registries` (string[], optional), `types` (string[], optional — e.g. `["registry:extension"]`), `limit` (number, optional, default 100), `offset` (number, optional)

### `search_items_in_registries`

Fuzzy-search extensions across registries (ranked across name, title, description, categories). Returns a runner-aware add command per result. Omit `registries` to search every configured registry.

**Input:** `registries` (string[], optional), `query` (string), `types` (string[], optional), `limit` (number, optional, default 100), `offset` (number, optional)

### `view_items_in_registries`

Full details for one or more extensions (dependencies, env vars, widgets, client setup, starter config).

**Input:** `items` (string[]) — e.g. `["@dashfy/github", "owner/repo/widget"]`

### `get_docs_for_items`

Setup-oriented docs: the author's setup notes, required env vars, how the extension integrates into the app/server, the starter dashboard, and a runner-aware install command. CLI equivalent: `dashfy docs`.

**Input:** `items` (string[])

### `get_add_command_for_items`

Returns the add command (prefixed with the project's package runner) for the given extensions.

**Input:** `items` (string[]) — e.g. `["@dashfy/github"]`

### `get_audit_checklist`

Project-aware post-install checklist: env vars to set, server setup, and starter blocks. CLI equivalent: `dashfy doctor`.

**Input:** none

---

## Configuring Registries

Namespaced and authenticated registries are set in `dashfy.json`. The `@dashfy` registry is always built-in. Public GitHub repositories can be used directly as `owner/repo` sources when they have a root registry catalog; they need no `dashfy.json` configuration.

```jsonc
{
  "registries": {
    "@acme": "https://acme.com/r/{name}.json",
    "@private": {
      "url": "https://private.com/r/{name}.json",
      "headers": { "Authorization": "Bearer ${MY_TOKEN}" },
    },
  },
}
```

- Names must start with `@`.
- URLs must contain `{name}`.
- `${VAR}` references resolve from environment variables (loaded from `.env` files).

Discovery index: `https://registry.dashfy.dev/registries.json`
