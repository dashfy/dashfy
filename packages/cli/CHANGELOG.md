# dashfy

## 0.1.3

### Patch Changes

- Update README and CLI documentation for registry build command.

## 0.1.2

### Patch Changes

- Build the hosted registry from published npm manifests instead of local ext-\* packages, and add `--from-npm` for registry builds. Align templates, fixtures, and docs with `/client` import paths and current extension metadata.

## 0.1.0

### Initial Release

- Dashfy CLI to scaffold dashboards and add extensions
- `init`/`create` command to scaffold runnable apps from Vite, Astro, Next.js, React Router, and TanStack Start templates
- `add` command to install registry extensions (npm package + codemods) by address
- Registry resolution over HTTP with the built-in `@getdashfy` namespace and custom registries via `dashfy.json`
- Built-in MCP server for editor and AI-assistant integration
