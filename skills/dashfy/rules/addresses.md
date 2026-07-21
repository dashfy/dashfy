# Extension Addresses

Always classify an extension address before resolving it. The scheme determines where the item comes from. See [registry.md](../registry.md) for the full table.

## Contents

- Classify before resolving
- Bare names mean @getdashfy
- Namespaces must be configured
- GitHub addresses and refs

---

## Classify before resolving

| Address                          | Scheme    | Resolves to                                             |
| -------------------------------- | --------- | ------------------------------------------------------- |
| `github`                         | dashfy    | `github` from built-in `@getdashfy` → `…/r/github.json` |
| `@getdashfy/github`              | namespace | the `@getdashfy` namespace, explicitly                  |
| `@acme/widget`                   | namespace | `widget` from configured registry `@acme`               |
| `https://example.com/r/foo.json` | url       | a direct URL to a built item                            |
| `./local/foo.json`               | file      | a local registry item on disk                           |
| `owner/repo/foo`                 | github    | `foo` from GitHub repo `owner/repo` (`#ref` optional)   |

Addresses ending in `.json` keep file/URL precedence over GitHub item parsing.

---

## Bare names mean @getdashfy

A bare name is shorthand for the built-in `@getdashfy` namespace — never a same-repo or relative reference.

**Incorrect:** treating `github` as a local file or same-repo item.

```bash
npx dashfy@latest add ./github
```

**Correct:**

```bash
npx dashfy@latest add github            # = @getdashfy/github
npx dashfy@latest add @getdashfy/github    # explicit
```

---

## Namespaces must be configured

A `@namespace` other than `@getdashfy` must exist in `dashfy.json`. When it isn't, `add` looks it up in the hosted discovery index and offers to configure it (auto-added with `-y`). Don't guess a registry on the user's behalf — if the namespace is unknown and not in the index, the command errors with guidance.

**Correct:** add the registry first, or let `add` auto-configure it.

```bash
npx dashfy@latest registry add @acme
npx dashfy@latest add @acme/widget
```

---

## GitHub addresses and refs

The first two segments are the GitHub owner and repo; the rest is the item name. Pin to a ref with `#ref` when needed.

```bash
npx dashfy@latest add owner/repo/widget
npx dashfy@latest add owner/repo/widget#v1.2.0
npx dashfy@latest add owner/repo/forms/login#main
```

Refs are not inherited by `registryDependencies` — if a pinned item depends on a sibling at the same ref, the dependency must spell it out (e.g. `owner/repo/bar#v2`).
