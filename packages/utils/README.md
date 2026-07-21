# `@getdashfy/utils`

> Formatting and utility functions for Dashfy - numbers, currencies, bytes, dates, times, strings, platform detection, and more.

## Introduction

`@getdashfy/utils` provides formatting and utility functions for Dashfy dashboards. It includes:

- **Format** - A flexible format API inspired by [Numeral.js](https://numeraljs.com) for numbers, dates, times, bytes, and more
- **Error** - Safe error message extraction
- **Function** - Utilities for common patterns
- **Object** - Safe nested property access
- **Platform** - Environment detection and OS helpers
- **String** - String manipulation and display helpers
- **Libs** - Re-export of [date-fns](https://date-fns.org)

## Install

Install with your favorite package manager:

#### `npm`

```bash
npm install @getdashfy/utils
```

#### `pnpm`

```bash
pnpm add @getdashfy/utils
```

#### `yarn`

```bash
yarn add @getdashfy/utils
```

#### `bun`

```bash
bun add @getdashfy/utils
```

## Quick Start

```ts
import { format, debounce, get, truncate, isClient } from '@getdashfy/utils'

// Format numbers with thousands separators
format(1000, '0,0')
// '1,000'

// Format compact notation
format(1500000, '0.0a')
// '1.5M'

// Format relative dates
format(new Date(), 'relative')
// 'less than a minute ago'

// Safely access nested object properties
get({ user: { name: 'John' } }, 'user.name')
// 'John'

// Truncate a long string
truncate('This is a long title that needs trimming', 20)
// 'This is a long title...'

// Debounce a function call
const debouncedSearch = debounce((query: string) => fetchResults(query), 300)

// Check execution environment
isClient // true in browser
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Type check
pnpm typecheck
```

## Community

Join the community on [Dashfy's Discord server](https://dashfy.dev/discord) to discuss the project, ask questions, or get help.

Join the conversation on X (Twitter) and follow [@dashfydev](https://x.com/dashfydev) for updates and announcements.

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](./LICENSE) file for details.
