# Contributing to Dashfy

Thanks for taking the time to contribute to Dashfy. This repository is a pnpm + Turborepo monorepo containing the Dashfy server runtime, UI, shared types, and themes.

Dashfy is designed to be developer-first, declarative, and extensible. Contributions that improve clarity, composability, and developer experience are especially welcome.

## Code of Conduct

This project adheres to the [Contributor Covenant](https://contributor-covenant.org). By participating, you are expected to uphold this code. Please report unacceptable behavior to <breno@dashfy.dev>.

## How Can I Contribute?

#### » Reporting Issues

- **Bugs / feature requests**: open an issue at https://github.com/dashfy/dashfy/issues.
- **Questions / clarifications**: start with an issue (or discussion) so we can align on direction.

#### » Issue Labels

Look out for issues tagged as [**good first issue**](https://github.com/dashfy/dashfy/issues?q=sort%3Aupdated-desc%20is%3Aissue%20state%3Aopen%20label%3A%22good%20first%20issue%22) or [**PR welcome**](https://github.com/dashfy/dashfy/issues?q=sort%3Aupdated-desc+is%3Aissue+state%3Aopen+label%3A%22PR+welcome%22) for tasks that are well-suited for new contributors. Feel free to comment on existing issues or create new ones.

#### » Submitting Pull Requests

We follow **GitHub Flow**. Please target the `main` branch.

Before sending a PR:

- **Open an issue first** for non-trivial changes, API changes, or new features (saves time and avoids duplicate work).
- Keep PRs **small and atomic** (one concern per PR).
- Include **tests** when behavior changes.
- Update **documentation** when you change public behavior or configuration.

#### » Branching

- **`main` branch**: primary development branch.
- **Feature branches**: Create a new branch for your feature (e.g., `feat/my-new-feature`), make your changes, and then open a PR targeting `main`.

#### » Commit Guidelines

This repo uses **[Conventional Commits](https://conventionalcommits.org)** (enforced by hooks).

Examples:

- `feat(server): add subscription cache metrics`
- `fix(ui): avoid duplicate notifications`
- `docs(server): document event contract`

## Development Setup

#### » Project Structure

```
dashfy/
├── apps/
│   └── registry           # Static host for the extension registry (registry.dashfy.dev)
├── templates/             # Standalone project templates (NOT in the workspace)
│   ├── vite-app           # Full Vite demo (GitHub, NBA, System, Market Live)
│   ├── vite-starter       # Minimal Vite starter for the interactive `init` flow
│   ├── astro-app          # Full Astro demo (GitHub, NBA, System, Market Live)
│   ├── astro-starter      # Minimal Astro starter for the interactive `init` flow
│   ├── next-app           # Full Next.js demo (GitHub, NBA, System, Market Live)
│   ├── next-starter       # Minimal Next.js starter for the interactive `init` flow
│   ├── react-router-app   # Full React Router demo (GitHub, NBA, System, Market Live)
│   ├── react-router-starter # Minimal React Router starter for the interactive `init` flow
│   ├── start-app          # Full TanStack Start demo (GitHub, NBA, System, Market Live)
│   └── start-starter      # Minimal TanStack Start starter for the interactive `init` flow
├── packages/
│   ├── cli                # `dashfy` CLI (init / add / registry:build)
│   ├── server             # Fastify + Socket.IO server
│   ├── ui                 # React component library
│   ├── themes             # Theme system
│   └── types              # Shared TypeScript types
└── tools/
    └── tsconfig           # Shared TypeScript configurations
```

> _Each template under `templates/` is a self-contained project with its own `eslint`, `prettier`, `tsconfig`, and `pnpm-workspace.yaml` (`packages: []`). They are intentionally excluded from the monorepo workspace._

#### » Local Environment Setup

We recommend running the app locally for development. Follow these steps:

1. Requirements:

- [NodeJS](https://nodejs.org)
- [pnpm](https://pnpm.io/installation)

> _See [`package.json`](./package.json) engines for more details._

2. Clone this repository:

```bash
git clone https://github.com/dashfy/dashfy.git
cd dashfy
```

3. Install dependencies:

```bash
pnpm install
```

4. Build all packages:

```bash
pnpm build
```

5. Scaffold a local app from a template:

The standalone templates are fetched by the CLI. For local development, point `DASHFY_TEMPLATE_DIR` at the repo's `templates/` folder so nothing is downloaded. Use `--no-install` until the `@getdashfy/*` packages are published to npm:

```bash
DASHFY_TEMPLATE_DIR="$PWD/templates" node packages/cli/dist/index.js init demo -t vite-app --no-install
cd demo
pnpm dev:all
```

> _Open http://localhost:3000 to see the demo application._

#### » Common commands (repo root)

```bash
pnpm build            # Build all packages
pnpm test             # Run all tests
pnpm lint             # Lint all packages
pnpm lint:fix         # Fix linting issues
pnpm format           # Format code with Prettier
pnpm typecheck       # Run TypeScript type checking
pnpm check:all        # Run all checks (lint, format, types)
pnpm clean:all        # Clean build artifacts, remove node_modules, and more
```

> _Check [`package.json`](./package.json) for other useful scripts._

#### » Working on a single package

Use pnpm filters to scope work:

```bash
pnpm --filter @getdashfy/server test
pnpm --filter @getdashfy/server dev
pnpm --filter @getdashfy/ui typecheck
```

#### » Running the demo app

Scaffold the full `vite-app` template (server + UI + extensions set up together) from the local checkout, then run it:

```bash
DASHFY_TEMPLATE_DIR="$PWD/templates" node packages/cli/dist/index.js init demo -t vite-app --no-install
cd demo && pnpm dev:all
```

> _Because the templates depend on the published `@getdashfy/*` packages, a full install requires those packages to be on npm (or a local registry such as Verdaccio/yalc). Use `--no-install` for setup-only checks in the meantime._

#### » Working on the extension registry

Extensions are resolved by the CLI from a registry over HTTP. The authoring source of
truth is the `dashfy` field in each `packages/ext-*/package.json`. Build the hosted
artifacts (per-extension `<name>.json` + `index.json`) into `apps/registry/public/r`:

```bash
pnpm --filter @getdashfy/registry build      # == dashfy registry:build
pnpm --filter @getdashfy/registry validate   # == dashfy registry validate
```

`validate` checks the built artifacts (and the `registries.json` discovery index)
against the registry schemas before publishing. Release deploys run it
automatically, so a broken registry never reaches `registry.dashfy.dev`.

To exercise `dashfy add` against the freshly built registry without any network,
point `DASHFY_REGISTRY_URL` at that directory (the registry analog of
`DASHFY_TEMPLATE_DIR`):

```bash
DASHFY_REGISTRY_URL="$PWD/apps/registry/public/r" \
  node packages/cli/dist/index.js add @getdashfy/github --cwd demo --no-install
```

The registry is deployed to `registry.dashfy.dev` on release via the
`deploy-registry` GitHub Actions workflow. Third-party authors can host their own
registry (a public URL serving `<name>.json` + `index.json`, or items under
`r/<name>.json` in a GitHub repo) and reference it from a project's `dashfy.json`.

## Coding Principles (project-level)

- Prefer **small, explicit contracts** over "magic".
- Keep the server **composable** and avoid framework lock-in where possible.
- Avoid leaking sensitive config to browsers (the server strips `apis` from `/config`).
- Make error handling **predictable** (typed inputs, clear messages, structured logging).

## Tests

Dashfy uses **Vitest** (per-package). Add or update tests when you change behavior.

Helpful patterns:

- Test the **event contract** (event names and payload shapes) when changing Bus behavior.
- Prefer tests that read like user intent ("subscribes and receives cached data") over trivial assertions.

## Acknowledgements

### Stack

Dashfy would not have been possible without the following open-source projects:

- **Backend**
  - **[Fastify](https://fastify.dev)**: Fast and low overhead web framework for Node.js.
  - **[Socket.IO](https://socket.io)**: Real-time bidirectional event-based communication.
  - **[Pino](https://getpino.io)**: Very low overhead Node.js logger.
  - **[Chokidar](https://github.com/paulmillr/chokidar)**: Efficient file watching library.
  - And other dependencies listed in the **[server package.json](./packages/server/package.json)**
- **Frontend**
  - **[React](https://react.dev)**: A JavaScript library for building user interfaces.
  - **[Tailwind CSS](https://tailwindcss.com)**: A utility-first CSS framework.
  - **[Radix UI](https://radix-ui.com)**: Unstyled, accessible UI components.
  - **[Shadcn UI](https://ui.shadcn.com)**: Beautifully designed components built with Radix UI and Tailwind CSS.
  - **[Zustand](https://zustand-demo.pmnd.rs)**: A small, fast state management library.
  - **[Recharts](https://recharts.org)**: A composable charting library built on React components.
  - **[Lucide React](https://lucide.dev)**: Beautiful & consistent icon toolkit.
  - And other dependencies listed in the **[ui package.json](./packages/ui/package.json)**
- **Project**
  - **[GitHub Actions](https://github.com/features/actions)**: For CI/CD.
  - **[pnpm Workspaces](https://pnpm.io/workspaces)**: A monorepo management tool.
  - **[Turborepo](https://turbo.build/repo)**: High-performance build system for JavaScript and TypeScript.
  - **[Changesets](https://github.com/changesets/changesets)**: A way to manage versioning and changelogs.
  - **[Storybook](https://storybook.js.org)**: UI component explorer for frontend developers.

### Inspiration

This project would not have been possible without the inspiration and work of others. Here are some projects that inspired me:

- **[Mozaïk](https://github.com/plouc/mozaik)**: A tool based on nodejs / react / redux / d3 to easily craft beautiful dashboards.
- **[Smashing](https://github.com/Smashing/smashing)**: Smashing, the spiritual successor to Dashing, is a Sinatra based framework that lets you build excellent dashboards.
- **[Dashing](https://github.com/Shopify/dashing)**: The exceptionally handsome dashboard framework in Ruby and Coffeescript.
- **[Metricio](https://github.com/metricio/metricio)**: Simple framework for easily creating dashboards to display metrics.

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](./LICENSE) file for details.
