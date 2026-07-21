# Registry Authoring and Addresses

Use this reference when the user wants to create, fix, publish, or reason about a Dashfy registry.

## Mental Model

Unlike shadcn (which copies source files), a Dashfy registry item describes an **npm package plus setup metadata**. "Applying" an item installs the package and runs codemods.

A registry has two forms:

- **Authored metadata**: the `dashfy` field in each extension's `package.json`. This is the source of truth.
- **Built registry**: generated JSON served to CLI consumers — one `<name>.json` per extension plus an `index.json` catalog, usually under `apps/registry/public/r`. Use `dashfy registry build` to create this form.

## Authored metadata: the `dashfy` package field

Each `@getdashfy/ext-*` package declares a `dashfy` object in its `package.json`:

```jsonc
{
  "name": "@getdashfy/ext-github",
  "version": "0.1.0",
  "dashfy": {
    "id": "github",
    "title": "GitHub",
    "description": "Display GitHub data with widgets and charts.",
    "categories": ["developer"],
    "docs": "Create a token at https://github.com/settings/tokens",
    "widgets": ["UserBadge", "RepoBadge", "PullRequests"],
    "client": {
      "import": "@getdashfy/ext-github",
      "factory": "createGitHubClient",
      "mode": "poll",
      "options": "{ token: process.env.GITHUB_TOKEN! }",
    },
    "envVars": ["GITHUB_TOKEN"],
    "starter": [{ "widget": "RepoBadge", "repository": "facebook/react" }],
    "registryDependencies": [],
  },
}
```

Field reference:

- `id` — the extension key used as the `extension` field in dashboard config and the registry item `name`.
- `title` — human-readable name.
- `description` — short summary (optional).
- `categories` — tags for search/filtering (optional).
- `docs` — author's setup notes, surfaced by `dashfy docs` (optional).
- `widgets` — array of exported component names registered via `WidgetRegistry.addExtension` (at least one; must match real exports).
- `client` — server data-source setup (omit for browser-only extensions):
  - `import` — module specifier to import the factory from.
  - `factory` — named factory export (e.g. `createGitHubClient`).
  - `mode` — `poll` (server polls the API) or `push` (API streams via callback).
  - `options` — raw TS source for the factory's options argument, e.g. `{ token: process.env.GITHUB_TOKEN! }` (optional).
- `envVars` — environment variables the extension needs; seeded into `.env` (optional).
- `starter` — starter widget blocks appended to `dashfy.config.yml`; each has a `widget` key plus passthrough props. Grid coordinates are computed by the CLI (optional).
- `registryDependencies` — other extensions required by this one, by address (optional).

## Built registry item

`dashfy registry build` turns the metadata above into a `registry:extension` item:

```jsonc
{
  "$schema": "https://dashfy.dev/schema/registry-item.json",
  "name": "github",
  "type": "registry:extension",
  "title": "GitHub",
  "description": "Display GitHub data with widgets and charts.",
  "dependencies": ["@getdashfy/ext-github@^0.1.0"],
  "registryDependencies": [],
  "envVars": ["GITHUB_TOKEN"],
  "categories": ["developer"],
  "docs": "Create a token at https://github.com/settings/tokens",
  "meta": {
    "extensionKey": "github",
    "widgets": ["UserBadge", "RepoBadge", "PullRequests"],
    "client": {
      "import": "@getdashfy/ext-github",
      "factory": "createGitHubClient",
      "mode": "poll",
      "options": "{ token: process.env.GITHUB_TOKEN! }",
    },
    "starter": [{ "widget": "RepoBadge", "repository": "facebook/react" }],
  },
}
```

Rules:

- `type` is always `registry:extension`.
- `dependencies` lists at least one npm package (the `@getdashfy/ext-*` package, optionally version-pinned).
- The built filename must match the item `name` (e.g. `github` → `github.json`).
- `index.json` is a condensed catalog (`name`, `type`, `title`, `description`, `categories`) and must stay in sync with the item files.

## Registry Dependencies

`registryDependencies` entries are **item addresses**, not npm package names. They are resolved and applied **first** when an extension is added.

```jsonc
{
  "registryDependencies": ["other-ext", "@acme/widget", "owner/repo/widget#v1.2.0"],
}
```

Dependency rules:

- Bare names such as `"other-ext"` mean items in the built-in `@getdashfy` namespace.
- Bare names never mean same-registry or same-repository items.
- Namespaced dependencies use `@namespace/item-name`.
- GitHub dependencies use `owner/repo/item-name`, optionally pinned with `#ref`.
- Do not use relative dependencies such as `"./bar"`.

## Address Schemes

When reasoning about an extension address string, classify it first.

| Address                          | Scheme    | Meaning                                                 |
| -------------------------------- | --------- | ------------------------------------------------------- |
| `github`                         | dashfy    | Item `github` from the built-in `@getdashfy` namespace. |
| `@getdashfy/github`              | namespace | The `@getdashfy` namespace, explicitly.                 |
| `@acme/widget`                   | namespace | Item `widget` from configured registry `@acme`.         |
| `https://example.com/r/foo.json` | url       | Built registry item JSON at that URL.                   |
| `./local/foo.json`               | file      | Built registry item JSON on disk.                       |
| `owner/repo/foo`                 | github    | Item `foo` from GitHub repo `owner/repo`.               |
| `owner/repo/foo#main`            | github    | Item `foo` from GitHub repo `owner/repo` at ref `main`. |

Addresses ending in `.json` keep file/URL precedence over GitHub item parsing.

## Custom & third-party registries

A custom registry endpoint is declared in `dashfy.json` under `registries`, merged over the built-in `@getdashfy`:

```jsonc
{
  "registries": {
    "@acme": "https://acme.com/r/{name}.json",
    "@private": {
      "url": "https://private.com/r/{name}.json",
      "headers": { "Authorization": "Bearer ${ACME_TOKEN}" },
    },
  },
}
```

- Names must start with `@`.
- URL templates must contain `{name}`.
- `${VAR}` references resolve from environment variables (loaded from `.env` files).

Items can also live in a public GitHub repo (under `r/<name>.json` with a root catalog) and be installed with `dashfy add owner/repo/widget` — no `dashfy.json` configuration needed.

### Discovery index (`registries.json`)

The CLI resolves bare namespaces (in `registry add` and `add`'s auto-config flow) from a hosted discovery index at `https://registry.dashfy.dev/registries.json`. It maps each public `@namespace` to its URL template plus optional `name`, `description`, and `homepage`:

```jsonc
{
  "$schema": "https://dashfy.dev/schema/registries.json",
  "registries": {
    "@acme": {
      "url": "https://acme.com/r/{name}.json",
      "name": "Acme",
      "description": "Acme dashboard widgets.",
      "homepage": "https://acme.com",
    },
  },
}
```

To list a community registry, open a PR adding it to `apps/registry/public/registries.json`. Override the index location with `DASHFY_REGISTRIES_URL` for offline work or testing.

## Build and Verify

```bash
# Build from package metadata.
npx dashfy@latest registry build
npx dashfy@latest registry build ./packages --output apps/registry/public/r

# Validate the output before publishing.
npx dashfy@latest registry validate
npx dashfy@latest registry validate ./public/r --registries ./public/registries.json --json

# Inspect via the CLI.
npx dashfy@latest search @acme -q "widget"
npx dashfy@latest view @acme/widget
npx dashfy@latest add @acme/widget --dry-run
```

Use GitHub addresses directly for public GitHub registries:

```bash
npx dashfy@latest search owner/repo -q "widget"
npx dashfy@latest view owner/repo/widget
npx dashfy@latest add owner/repo/widget --dry-run
```
