# Storybook Configuration

This directory contains the Storybook configuration for the `@dashfy/ui` package.

## 🎨 Theme System

Storybook uses the **App component** which includes the `ThemeProvider` from `@dashfy/themes`. This ensures that the same theme system used in the application is available in Storybook.

### How It Works

1. **App Component Wrapper**: All stories are wrapped with the `<App>` component
2. **ThemeProvider**: Automatically applies theme CSS variables dynamically
3. **Theme Toggle**: Custom toolbar in Storybook to switch between light/dark modes
4. **Store Integration**: Uses the Zustand store to manage theme state

### Theme Toggle

Look for the **Theme** dropdown in the Storybook toolbar (top of the page):

- **Light** - Default light theme
- **Dark** - Dark theme

The theme is applied globally and affects all stories.

## 📁 Files

### `main.ts`

Main Storybook configuration:

- Story file patterns
- Addons configuration
- Vite setup with path aliases
- Optimization for workspace packages

### `preview.tsx`

Preview configuration:

- Wraps all stories with `<App>` component
- Theme toggle in toolbar
- Global decorators
- Control matchers

## 🔧 Configuration Details

### Decorators

Stories are wrapped in this order:

1. **App component** - Provides ThemeProvider and TooltipProvider
2. **Container div** - Adds padding and background

### Path Aliases

The `@/` alias points to `../src/` directory, matching the tsconfig setup.

### Optimized Dependencies

The following workspace packages are pre-bundled for performance:

- `@dashfy/themes`
- `@dashfy/types`

## 🛠️ Development

### Running Storybook

```bash
pnpm storybook
```

### Building Storybook

```bash
pnpm build:storybook
```

## 🎯 Adding Custom Themes

To add a new theme:

1. Create theme in `packages/themes/src/themes/`
2. Export from `packages/themes/src/index.ts`
3. Theme will automatically be available in Storybook

## 📚 Resources

- [Storybook Documentation](https://storybook.js.org/docs)
- [Vite Plugin](https://github.com/storybookjs/storybook/tree/next/code/frameworks/react-vite)
- [Writing Stories](https://storybook.js.org/docs/react/writing-stories/introduction)
