# Format

> A flexible formatting API inspired by [Numeral.js](https://numeraljs.com) for numbers, currencies, bytes, dates, times, temperatures, and more.

## Introduction

The `format` module provides a unified formatting API for Dashfy dashboards. It handles:

- **[Numbers](#numbers)** - Thousands separators, decimals, and compact notation
- **[Currency](#currency)** - Multi-currency support with locale-aware formatting
- **[Bytes](#bytes)** - Binary and decimal byte formatting
- **[Percentages](#percentages)** - Ratio to percentage conversion
- **[Time](#time)** - Duration and clock time formatting
- **[Temperature](#temperature)** - Celsius, Fahrenheit, and Kelvin
- **[Dates](#dates)** - Absolute and relative date formatting
- **[Ordinal](#ordinal)** - Ordinal number suffixes (1st, 2nd, 3rd)
- **[Exponential](#exponential)** - Scientific notation
- **[List](#list)** - Array to human-readable list

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
import { format } from '@getdashfy/utils'

// Format numbers with thousands separators
format(1000, '0,0')
// '1,000'

// Format compact notation
format(1500000, '0.0a')
// '1.5M'

// Format currency
format(1234.56, '$0,0.00')
// '$1,234.56'

// Format bytes
format(1024, '0b')
// '1.02 kB'

// Format percentages
format(0.5, '0%')
// '50%'

// Format relative dates
format(new Date(), 'relative')
// 'less than a minute ago'

// Format duration
format(3661, 'duration')
// '1 hour 1 minute 1 second'
```

## Format

The main `format` function takes a value and a format string. Format strings determine the output style — similar to [Numeral.js](https://numeraljs.com).

### Signature

```ts
format(value, formatString, options?)
```

Format accepts numbers, bigints, dates, strings, or arrays (for lists). The format string is parsed and matched to the appropriate formatter.

```ts
format(1000, '0,0')
// '1,000'

format(0.5, '0%')
// '50%'

format(new Date(), 'date')
// 'Mar 15, 2024'

format(['A', 'B', 'C'], 'list')
// 'A, B, and C'
```

### Numbers

| Format  | Example                    | Output         |
| ------- | -------------------------- | -------------- |
| `0,0`   | `format(1000, '0,0')`      | `1,000`        |
| `0.00`  | `format(3.14159, '0.00')`  | `3.14`         |
| `0.000` | `format(3.14159, '0.000')` | `3.142`        |
| `0.0a`  | `format(1500, '0.0a')`     | `1.5K`         |
| `0a`    | `format(1500000, '0a')`    | `1.5M`         |
| `0 a`   | `format(1500, '0 a')`      | `1.5 thousand` |

### Currency

| Format    | Example                      | Output      |
| --------- | ---------------------------- | ----------- |
| `$0,0.00` | `format(1234.56, '$0,0.00')` | `$1,234.56` |
| `$0,0`    | `format(1000, '$0,0')`       | `$1,000`    |
| `€0,0.00` | `format(99.99, '€0,0.00')`   | `€99.99`    |
| `£0,0`    | `format(50, '£0,0')`         | `£50`       |

### Bytes

| Format  | Example                 | Output      |
| ------- | ----------------------- | ----------- |
| `0b`    | `format(1024, '0b')`    | `1.02 kB`   |
| `0ib`   | `format(1024, '0ib')`   | `1 KiB`     |
| `0 b`   | `format(2048, '0 b')`   | `2 kB`      |
| `0b/s`  | `format(1024, '0b/s')`  | `1.02 kB/s` |
| `0ib/s` | `format(1024, '0ib/s')` | `1 KiB/s`   |
| `bps`   | `format(1024, 'bps')`   | `1.02 kB/s` |

- `0b` / `0ib` / `0 b` — total bytes via `formatBytes`
- `0b/s`, `0ib/s`, `bps`, or any string ending in `/s` — throughput via `formatBytesPerSecond` - binary units kick in when the string contains `ib`

### Percentages

| Format  | Example                   | Output   |
| ------- | ------------------------- | -------- |
| `0%`    | `format(0.5, '0%')`       | `50%`    |
| `0.0%`  | `format(0.123, '0.0%')`   | `12.3%`  |
| `0.00%` | `format(0.1234, '0.00%')` | `12.34%` |

### Time

| Format     | Example                                            | Output                     |
| ---------- | -------------------------------------------------- | -------------------------- |
| `time`     | `format(19, 'time')`                               | `19 seconds`               |
| `duration` | `format(3661, 'duration')`                         | `1 hour 1 minute 1 second` |
| `uptime`   | `format(3 * 86400 + 5 * 3600 + 12 * 60, 'uptime')` | `3d 5h 12m`                |
| `0:00:00`  | `format(3661, '0:00:00')`                          | `01:01:01`                 |
| `:`        | `format(65, ':')`                                  | `00:01:05`                 |

- `time` / `duration` — long human-readable duration ("1 hour 30 minutes")
- `uptime` — compact, multi-day-aware duration (`3d 5h 12m`); ideal for system uptime
- Format strings containing `:` — output `HH:MM:SS` clock format

### Temperature

| Format       | Example                    | Output     |
| ------------ | -------------------------- | ---------- |
| `0°`         | `format(25, '0°')`         | `25°C`     |
| `celsius`    | `format(25, 'celsius')`    | `25°C`     |
| `fahrenheit` | `format(77, 'fahrenheit')` | `77°F`     |
| `kelvin`     | `format(273.15, 'kelvin')` | `273.15 K` |

### Dates

| Format     | Example                          | Input type                         | Output                |
| ---------- | -------------------------------- | ---------------------------------- | --------------------- |
| `date`     | `format(new Date(), 'date')`     | Date / ISO string                  | `Mar 15, 2024`        |
| `short`    | `format(date, 'short')`          | Date / ISO string                  | `Mar 15`              |
| `long`     | `format(date, 'long')`           | Date / ISO string                  | `March 15, 2024`      |
| `iso`      | `format(date, 'iso')`            | Date / ISO string                  | `2024-03-15T12:00:00` |
| `relative` | `format(new Date(), 'relative')` | Date / ISO string / Unix timestamp | `2 hours ago`         |

### Ordinal

| Format    | Example                | Output |
| --------- | ---------------------- | ------ |
| `ordinal` | `format(1, 'ordinal')` | `1st`  |
| `0o`      | `format(3, '0o')`      | `3rd`  |

### Exponential

| Format        | Example                       | Output    |
| ------------- | ----------------------------- | --------- |
| `exponential` | `format(1234, 'exponential')` | `1.23E3`  |
| `0.00e+0`     | `format(0.001, '0.00e+0')`    | `1.00e-3` |

### List

| Format | Example                           | Output        |
| ------ | --------------------------------- | ------------- |
| `list` | `format(['A', 'B', 'C'], 'list')` | `A, B, and C` |

## Global Configuration

### Default Locale

Set a locale that applies to all `format` calls:

```ts
import { format, setDefaultLocale, getDefaultLocale } from '@getdashfy/utils'

setDefaultLocale('pt-BR')
format(1234.56, '$0,0.00')
// 'R$ 1.234,56'

getDefaultLocale()
// 'pt-BR'

setDefaultLocale(undefined) // reset to runtime default
```

### Custom Zero and Null Formatting

```ts
format(0, '0.0', { zeroFormat: 'N/A' })
// 'N/A'

format(null, '0.0', { nullFormat: '—' })
// '—'
```

### Options

All `format` calls accept an optional `BaseFormatOptions` object:

```ts
interface BaseFormatOptions {
  locale?: string | string[] // BCP 47 locale(s)
  zeroFormat?: string // Custom output for 0
  nullFormat?: string // Custom output for null/undefined
}
```

Format-specific options (e.g. `currency`, `unit`) can be passed when the format string implies them, or inferred from symbols (e.g. `€` → EUR).

## Advanced Usage

### Locale Support

All format functions support locale-specific formatting through the `locale` option:

```ts
// German locale - uses comma for decimals and period for thousands
format(1234.56, '0,0.00', { locale: 'de-DE' })
// '1.234,56'

// French locale
format(1234.56, '$0,0.00', { locale: 'fr-FR' })
// '1 234,56 $US'

// Japanese locale
format(1000000, '0,0', { locale: 'ja-JP' })
// '1,000,000'
```

### Custom Formatters

The format module includes specialized formatters that can be imported directly:

```ts
import {
  formatNumber,
  formatCurrency,
  formatBytes,
  formatPercent,
  formatTime,
  formatTemperature,
  formatDate,
  formatRelativeTime,
  formatOrdinal,
  formatExponential,
  formatList,
} from '@getdashfy/utils'

// Use specialized formatters with more control
formatCurrency(1234.56, { currency: 'EUR', locale: 'de-DE' })
// '1.234,56 €'

formatBytes(1024, { binary: true })
// '1 KiB'

formatTime(3661, { style: 'long' })
// '1 hour 1 minute 1 second'
```

## TypeScript Support

Fully typed with TypeScript:

```ts
import type { BaseFormatOptions } from '@getdashfy/utils'

const options: BaseFormatOptions = {
  locale: 'en-US',
  zeroFormat: '—',
  nullFormat: 'N/A',
}

format(1000, '0,0', options)
```

## Dependencies

- [date-fns](https://date-fns.org) - Date manipulation and formatting
- [pretty-bytes](https://github.com/sindresorhus/pretty-bytes) - Byte formatting

## Community

Join the community on [Dashfy's Discord server](https://dashfy.dev/discord) to discuss the project, ask questions, or get help.

Join the conversation on X (Twitter) and follow [@dashfydev](https://x.com/dashfydev) for updates and announcements.

## License

This project is licensed under the AGPL-3.0 License - see the [LICENSE](./LICENSE) file for details.
