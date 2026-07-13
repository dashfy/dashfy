# Dashboard Layout

Rules for laying out widgets on a dashboard grid in `dashfy.config.yml`. See [config.md](../config.md) for the full file shape.

## Contents

- Every widget needs grid coordinates
- Stay inside the grid
- No overlapping widgets
- Only reference registered widgets

---

## Every widget needs grid coordinates

A widget block must declare `extension`, `widget`, `x`, `y`, `columns`, and `rows`. Anything else is passed as props.

**Incorrect:** missing coordinates.

```yaml
- extension: github
  widget: RepoBadge
  repository: vercel/next.js
```

**Correct:**

```yaml
- extension: github
  widget: RepoBadge
  x: 0
  y: 0
  columns: 1
  rows: 1
  repository: vercel/next.js
```

---

## Stay inside the grid

A widget must fit within the dashboard's `columns` × `rows`. With `x` and `y` 0-based:

- `x + columns <= dashboard.columns`
- `y + rows <= dashboard.rows`
- `x >= 0`, `y >= 0`, `columns >= 1`, `rows >= 1`

**Incorrect:** a 4-wide widget at `x: 2` on a 4-column grid (`2 + 4 = 6 > 4`).

```yaml
dashboards:
  - title: Stats
    columns: 4
    rows: 2
    widgets:
      - extension: system
        widget: CpuUsageLine
        x: 2
        y: 0
        columns: 4
        rows: 1
```

**Correct:**

```yaml
dashboards:
  - title: Stats
    columns: 4
    rows: 2
    widgets:
      - extension: system
        widget: CpuUsageLine
        x: 0
        y: 0
        columns: 4
        rows: 1
```

---

## No overlapping widgets

Two widgets must not occupy the same cell.

**Incorrect:** both widgets cover cell (0,0).

```yaml
widgets:
  - extension: github
    widget: UserBadge
    x: 0
    y: 0
    columns: 2
    rows: 1
  - extension: github
    widget: OrgBadge
    x: 1
    y: 0
    columns: 1
    rows: 1
```

**Correct:** place the second widget in a free cell.

```yaml
widgets:
  - extension: github
    widget: UserBadge
    x: 0
    y: 0
    columns: 2
    rows: 1
  - extension: github
    widget: OrgBadge
    x: 2
    y: 0
    columns: 1
    rows: 1
```

---

## Only reference registered widgets

The `widget` value must be an export listed in the extension's `widgets[]` (see [rules/extension-authoring.md](./extension-authoring.md)). Referencing a name that the extension doesn't register will not render.

**Incorrect:** `Charts` is not a GitHub widget.

```yaml
- extension: github
  widget: Charts
  x: 0
  y: 0
  columns: 2
  rows: 1
```

**Correct:** use a real export (e.g. `CommitActivityLine`). Verify with `npx dashfy@latest view @dashfy/github` or `dashfy docs github`.

```yaml
- extension: github
  widget: CommitActivityLine
  x: 0
  y: 0
  columns: 2
  rows: 1
  repository: vercel/next.js
```
