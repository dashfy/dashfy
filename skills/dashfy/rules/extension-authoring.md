# Extension Authoring

Rules for authoring a Dashfy extension's registry metadata — the `dashfy` field in its `package.json`. See [registry.md](../registry.md) for the full field reference and the built-item shape.

## Contents

- Author metadata in package.json, not by hand-writing item JSON
- widgets must match real exports
- Browser-only extensions omit client
- Choose the right client mode
- Build and validate before publishing

---

## Author metadata in package.json

The source of truth is the `dashfy` object in the extension package's `package.json`. `dashfy registry build` generates the served `<name>.json` + `index.json` from it. Don't hand-write item JSON into the registry output.

**Correct:**

```jsonc
// packages/ext-acme/package.json
{
  "name": "@acme/ext-weather",
  "version": "0.1.0",
  "dashfy": {
    "id": "weather",
    "title": "Weather",
    "categories": ["data"],
    "widgets": ["CurrentConditions", "Forecast"],
    "client": {
      "import": "@acme/ext-weather",
      "factory": "createWeatherClient",
      "mode": "poll",
      "options": "{ apiKey: process.env.WEATHER_API_KEY! }",
    },
    "envVars": ["WEATHER_API_KEY"],
    "starter": [{ "widget": "CurrentConditions", "city": "Lisbon" }],
  },
}
```

```bash
npx dashfy@latest registry build
```

---

## widgets must match real exports

Every name in `widgets[]` must be an actual exported component from the package, and there must be at least one.

**Incorrect:** listing a widget that isn't exported.

```jsonc
"widgets": ["CurrentConditions", "Forecast", "RadarMap"]  // RadarMap not exported
```

**Correct:** only list real exports.

```jsonc
"widgets": ["CurrentConditions", "Forecast"]
```

These names are what users reference as `widget:` in `dashfy.config.yml`.

---

## Browser-only extensions omit client

If an extension has no server-side data source (it fetches directly in the browser, like `market-live`), omit the `client` field entirely. `dashfy add` will then skip the server setup.

**Incorrect:** adding an empty/fake client to a browser-only extension.

```jsonc
"client": { "import": "@acme/ext-prices", "factory": "noop", "mode": "poll" }
```

**Correct:** no `client` key.

```jsonc
{
  "id": "prices",
  "title": "Prices",
  "widgets": ["PriceLive", "TableLive"],
}
```

---

## Choose the right client mode

When the extension does have a `client`, pick the mode that matches how data flows:

- `poll` — the server periodically calls the API methods (default; e.g. GitHub).
- `push` — the API streams data via a callback (e.g. live system metrics).

Put any constructor arguments as raw TS in `options`, e.g. `"{ token: process.env.GITHUB_TOKEN! }"`. Declare the env vars it reads in `envVars[]` so `add` seeds them.

---

## Build and validate before publishing

After editing metadata, always build and validate:

```bash
npx dashfy@latest registry build
npx dashfy@latest registry validate
```

`validate` checks schema conformance, that filenames match item names, no duplicate names, the index is in sync, and local `registryDependencies` resolve within the registry. It exits non-zero on failure — add it to CI.
