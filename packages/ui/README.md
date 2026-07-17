# `@dashfy/ui`

> Dashfy UI component library for building Dashfy dashboards.

## Introduction

`@dashfy/ui` is the frontend runtime for Dashfy dashboards. It provides a complete React component library for rendering dashboards, managing WebSocket connections, handling real-time data subscriptions, and providing an extensible widget system.

The UI library acts as the client-side orchestrator that:

- Connects to the Dashfy server via WebSockets
- Renders dashboard layouts and widgets
- Manages real-time data subscriptions
- Provides theme support and customization
- Handles user interactions and keyboard shortcuts
- Manages application state with Zustand

## Install

Install with your favorite package manager:

#### `npm`

```bash
npm install @dashfy/ui
```

#### `pnpm`

```bash
pnpm add @dashfy/ui
```

#### `yarn`

```bash
yarn add @dashfy/ui
```

#### `bun`

```bash
bun add @dashfy/ui
```

## Quick Start

Create a Dashfy client and register extension widgets:

```tsx
import { CustomJson, JsonKeys, JsonStatus } from '@dashfy/ext-json'
import {
  Branches,
  CommitActivityLine,
  ContributorsStats,
  Gitmap,
  OrgBadge,
  PullRequests,
  RepoBadge,
  Status,
  UserBadge,
} from '@dashfy/ext-github'
import { Dashfy, WidgetRegistry } from '@dashfy/ui'

// Register GitHub extension widgets
WidgetRegistry.addExtension('github', {
  Branches,
  CommitActivityLine,
  ContributorsStats,
  Gitmap,
  OrgBadge,
  PullRequests,
  RepoBadge,
  Status,
  UserBadge,
})

// Register JSON extension widgets
WidgetRegistry.addExtension('json', {
  CustomJson,
  JsonKeys,
  JsonStatus,
})

export const App = () => {
  return <Dashfy serverUrl="http://localhost:5001" />
}
```

## Core Features

#### » Widget System

Extensible widget registry for registering and managing dashboard widgets:

```tsx
import { WidgetRegistry } from '@dashfy/ui'
import { MyCustomWidget, AnotherWidget } from './widgets'

// Register a single widget
WidgetRegistry.register('myextension:CustomWidget', MyCustomWidget)

// Register multiple widgets from an extension
WidgetRegistry.addExtension('myextension', {
  CustomWidget: MyCustomWidget,
  AnotherWidget,
})

// Get a registered widget
const Widget = WidgetRegistry.getComponent('myextension', 'CustomWidget')
```

**Widget Lifecycle:**

1. Widgets are registered via `WidgetRegistry`
2. Dashboard configuration references widgets by `extension:widget` name
3. Dashfy component dynamically loads and renders widgets
4. Widgets subscribe to API data via `useApiSubscription` hook
5. Real-time updates flow through WebSocket to widget components

#### » Real-time Data Subscriptions

Built-in hooks for subscribing to API data from the server:

```tsx
import {
  useApiSubscription,
  Widget,
  WidgetHeader,
  WidgetBody,
  WidgetLoader,
  WidgetError,
} from '@dashfy/ui'

export const MyWidget = ({ repository }: { repository: string }) => {
  const { data, error, loading } = useApiSubscription<RepoData>({
    api: 'github',
    endpoint: 'repo',
    params: { repository },
  })

  if (loading) return <WidgetLoader />
  if (error) return <WidgetError error={error} />

  return (
    <Widget>
      <WidgetHeader title="GitHub Repository" />
      <WidgetBody>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </WidgetBody>
    </Widget>
  )
}
```

**Subscription Features:**

- Automatic subscription on mount
- Automatic unsubscription on unmount
- Loading and error states
- Type-safe data handling
- Shared subscriptions (multiple widgets can subscribe to same data)

#### » WebSocket Connection

Managed [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) connection with automatic reconnection:

```tsx
import { useWebSocket } from '@dashfy/ui'

const socket = useWebSocket({
  url: 'http://localhost:5001', // Server URL
  autoConnect: true,
  reconnect: true,
})

if (!socket) {
  return <div>Connecting...</div>
}

// Socket is ready to use
```

**Connection Features:**

- Automatic reconnection with configurable attempts and delays
- Connection status tracking (via store)
- Automatic resubscription of API endpoints on reconnect
- Integration with notification system
- Graceful error handling and cleanup

#### » Theme System

Built-in theme support with light/dark mode:

```tsx
import { ThemeRegistry } from '@dashfy/ui'
import { defaultTheme, nordTheme } from '@dashfy/themes'
import { myCustomTheme } from './themes/custom'

// Load all built-in themes from @dashfy/themes
ThemeRegistry.loadAllThemes()

// Or register themes individually
ThemeRegistry.add(myCustomTheme)

// Or register multiple themes at once
ThemeRegistry.addAll([defaultTheme, nordTheme])

// Set default theme
ThemeRegistry.defaultTheme = 'nord'

// Get all theme IDs
const themeIds = ThemeRegistry.list()

// Get a specific theme
const theme = ThemeRegistry.get('nord')
```

**Theme Features:**

- Built-in themes from `@dashfy/themes` package
- Light/dark mode support
- CSS variable-based theming
- LocalStorage persistence
- Theme switching via settings panel

#### » Keyboard Shortcuts

Built-in keyboard shortcuts for dashboard control:

| Shortcut              | Action                   |
| --------------------- | ------------------------ |
| `Space`               | Start/Pause rotation     |
| `←` / `→`             | Navigate dashboards      |
| `F`                   | Toggle fullscreen        |
| `S` or `Cmd/Ctrl + ,` | Open settings            |
| `Esc`                 | Close settings/exit full |
| `Cmd/Ctrl + P`        | Open bottom panel        |

#### » Bottom Panel

Tabbed bottom panel with built-in tabs:

- **Connection:** WebSocket connection status and server info
- **Console:** Real-time logs and API events
- **Notifications:** System notifications and alerts

#### » State Management

Centralized state management with [Zustand](https://github.com/pmndrs/zustand):

```tsx
import { useDashfyStore } from '@dashfy/ui'

// Access store slices
const config = useDashfyStore((state) => state.config)
const dashboards = useDashfyStore((state) => state.dashboards)
const currentTheme = useDashfyStore((state) => state.currentTheme)

// Dispatch actions
const setTheme = useDashfyStore((state) => state.setTheme)
const nextDashboard = useDashfyStore((state) => state.nextDashboard)
```

## Widget Architecture

#### » Widget Props

Widgets receive props from dashboard configuration. The `WidgetConfig` interface defines the standard properties:

```tsx
interface WidgetConfig {
  extension: string
  widget: string
  title?: string
  columns: number
  rows: number
  x: number
  y: number
  // Custom props defined in configuration
  [key: string]: unknown
}
```

When creating widgets, you can define your own prop interface that extends the configuration properties you need.

#### » Widget Structure

Recommended widget structure:

```tsx
import {
  useApiSubscription,
  Widget,
  WidgetHeader,
  WidgetBody,
  WidgetLoader,
  WidgetError,
  WidgetEmpty,
} from '@dashfy/ui'

interface MyWidgetProps {
  title?: string
  repository: string
}

export const MyWidget = ({ title, repository }: MyWidgetProps) => {
  const { data, error, loading } = useApiSubscription<RepoData>({
    api: 'github',
    endpoint: 'repo',
    params: { repository },
  })

  if (loading) return <WidgetLoader />
  if (error) return <WidgetError error={error} />
  if (!data) return <WidgetEmpty message="No data available" />

  return (
    <Widget>
      <WidgetHeader title={title || data.name} />
      <WidgetBody>
        <div className="space-y-2">
          <p>{data.description}</p>
          <div className="flex gap-4">
            <span>⭐ {data.stars}</span>
            <span>🍴 {data.forks}</span>
          </div>
        </div>
      </WidgetBody>
    </Widget>
  )
}
```

**Widget Best Practices:**

- Use `useApiSubscription` for data fetching
- Handle loading, error, and empty states
- Use base widget components for consistent styling
- Keep widgets focused and composable
- Provide TypeScript types for props
- Use error boundaries for resilience

#### » Widget Registration

Register widgets before rendering the Dashfy component:

```tsx
import { WidgetRegistry } from '@dashfy/ui'
import { MyWidget } from './widgets/MyWidget'

// Register extension with multiple widgets
WidgetRegistry.addExtension('myextension', {
  MyWidget,
  AnotherWidget,
  ThirdWidget,
})
```

#### » Widget Configuration

Reference widgets in dashboard configuration:

```json
{
  "dashboards": [
    {
      "title": "My Dashboard",
      "columns": 3,
      "rows": 2,
      "widgets": [
        {
          "extension": "myextension",
          "widget": "MyWidget",
          "x": 0,
          "y": 0,
          "columns": 1,
          "rows": 1,
          "title": "Custom Title",
          "repository": "facebook/react"
        }
      ]
    }
  ]
}
```

## Styling

The UI library uses [Tailwind CSS](https://tailwindcss.com) with custom theme tokens:

```tsx
// Use Tailwind utility classes
<div className="bg-background text-foreground p-4 rounded-lg border">
  Content
</div>

// Use theme CSS variables
<div style={{ color: 'hsl(var(--primary))' }}>
  Themed text
</div>
```

**Theme Variables:**

- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`
- `--card`, `--card-foreground`
- `--popover`, `--popover-foreground`

## TypeScript Support

Fully typed with TypeScript:

```tsx
import type { DashfyConfig, DashboardConfig, WidgetConfig } from '@dashfy/ui'

const dashfyConfig: DashfyConfig = {
  dashboards: [
    /* ... */
  ],
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev

# Run Storybook
pnpm storybook

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## Community

Join the community on [Dashfy's Discord server](https://dashfy.dev/discord) to discuss the project, ask questions, or get help.

Join the conversation on X (Twitter) and follow [@dashfydev](https://x.com/dashfydev) for updates and announcements.

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](./LICENSE) file for details.
