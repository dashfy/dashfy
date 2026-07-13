# Setup & Lifecycle

How `dashfy add` / `dashfy remove` codemod a project, and the rules an assistant must follow.

## Contents

- Use the CLI, never set up by hand
- What `add` changes
- What `remove` reverses
- Idempotency
- Env var safety

---

## Use the CLI, never set up by hand

Adding an extension is a codemod across four files. Do not edit them by hand — run `dashfy add` so the setup stays consistent and reversible.

**Incorrect:** manually editing `App.tsx` to import and register a widget.

```tsx
import { UserBadge } from '@dashfy/ext-github'

WidgetRegistry.addExtension('github', { UserBadge })
```

**Correct:**

```bash
npx dashfy@latest add @dashfy/github
```

The same applies to the server bootstrap, `.env`, and `dashfy.config.yml` — let the CLI write them.

---

## What `add` changes

`dashfy add <address>` resolves the item, installs the npm package(s), then:

- registers widgets in `App.tsx` via `WidgetRegistry.addExtension`
- registers the server API in the server bootstrap via `dashfy.registerApi` (only when the extension has a `client`)
- adds required environment variables to `.env` as **empty placeholders** (e.g. `GITHUB_TOKEN=`)
- appends the extension's `starter` widget blocks to `dashfy.config.yml` as a new dashboard

`registryDependencies` are resolved and applied first.

---

## What `remove` reverses

`dashfy remove <address>` reverses exactly what `add` set up:

- removes the `WidgetRegistry.addExtension` registration and widget imports from `App.tsx`
- removes the `dashfy.registerApi` registration and client import from the server bootstrap
- removes the starter dashboard it created from `dashfy.config.yml`
- removes the extension's `.env` entries — **only empty placeholders**
- uninstalls the `@dashfy/ext-*` package (unless `--keep-deps`)

---

## Idempotency

Every step is idempotent. Re-adding an already-configured extension is a safe no-op; removing one that isn't set up is a safe no-op. So you never need to guard `add`/`remove` with manual existence checks.

---

## Env var safety

`remove` never deletes secrets.

**Incorrect:** assuming `remove` wipes the whole line.

```ini
# .env  — before remove
GITHUB_TOKEN=ghp_realsecretvalue
```

**Correct:** a line that holds a value is **preserved** and reported; only empty placeholders are stripped.

```ini
# .env  — only this form is removed
GITHUB_TOKEN=
```

Never commit real tokens. After `add`, fill the seeded placeholders in `.env` locally. In offline mode (registry unreachable), `remove` derives the setup from the project and **skips** env cleanup, since the variable list can't be derived.
