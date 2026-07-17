import { formatBytes, formatBytesPerSecond } from './bytes'
import { formatCurrency } from './currency'
import { formatDate, formatRelativeTime } from './date'
import { formatExponential } from './exponential'
import { formatList } from './list'
import { formatNumber } from './number'
import { formatOrdinal } from './ordinal'
import { formatPercent } from './percent'
import { formatTemperature } from './temperature'
import { formatTime, formatTimeCompact } from './time'
import type { BaseFormatOptions, DateFormatOptions } from './types'

/**
 * Main format function - parses format strings and delegates to the appropriate formatter.
 *
 * @param value - The value to format
 * @param formatString - The format string
 * @param options - Optional formatting options
 * @returns The formatted value
 *
 * @example
 * ```ts
 * format(1000, '0,0')
 * // => '1,000'
 *
 * format(1500000, '0.0a')
 * // => '1.5M'
 *
 * format(new Date(), 'relative')
 * // => 'less than a minute ago'
 * ```
 */
export function format(
  value: number | bigint | Date | string | string[] | null | undefined,
  formatString: string,
  options?: BaseFormatOptions,
): string {
  if (value === null || value === undefined) {
    if (options?.nullFormat !== undefined) {
      return options.nullFormat
    }

    return ''
  }

  const str = formatString.trim().toLowerCase()

  if (str === 'ordinal' || str === '0o') {
    return formatOrdinal(Number(value), options)
  }

  if (str === 'relative') {
    const date =
      value instanceof Date
        ? value
        : typeof value === 'number'
          ? new Date(value * 1000)
          : new Date(value as string)
    return formatRelativeTime(date, { ...options, addSuffix: true })
  }

  if (str === 'list') {
    return formatList(value as unknown as string[], options)
  }

  if (str === 'exponential' || str === '0.00e+0' || /e[+-]/.test(str)) {
    return formatExponential(Number(value), options)
  }

  if (/\$|currency/.test(str)) {
    /* v8 ignore next */
    const currency = str.includes('€') ? 'EUR' : str.includes('£') ? 'GBP' : 'USD'
    return formatCurrency(Number(value), { ...options, currency })
  }

  if (/%|percent/.test(str)) {
    const decimals = /\.(0+)/.exec(str)?.[1]?.length ?? 0
    return formatPercent(Number(value), {
      ...options,
      maximumFractionDigits: decimals,
    })
  }

  if (str === 'bps' || str.endsWith('/s')) {
    const binary = str.includes('ib')
    return formatBytesPerSecond(typeof value === 'bigint' ? value : Number(value), {
      ...options,
      binary,
    })
  }

  if (/0\s?i?b|bytes/.test(str)) {
    const binary = str.includes('ib')
    return formatBytes(typeof value === 'bigint' ? value : Number(value), {
      ...options,
      binary,
    })
  }

  if (str === 'uptime' && typeof value === 'number') {
    return formatTimeCompact(value, options)
  }

  if ((str === 'time' || str === 'duration') && typeof value === 'number') {
    return formatTime(value, { ...options, style: 'long' })
  }

  if (/[:]/.test(str) && typeof value === 'number') {
    return formatTime(value, { ...options, style: 'short' })
  }

  if (/temp|°|celsius|fahrenheit|kelvin/.test(str)) {
    const unit = str.includes('f') ? 'fahrenheit' : str.includes('k') ? 'kelvin' : 'celsius'
    return formatTemperature(Number(value), { ...options, unit })
  }

  if (/date|short|long|iso/.test(str)) {
    const date =
      value instanceof Date
        ? value
        : typeof value === 'number'
          ? new Date(value * 1000)
          : new Date(value as string)

    if (str === 'short') {
      return formatDate(date, { ...options, format: 'MMM d' })
    }

    if (str === 'long') {
      return formatDate(date, { ...options, format: 'MMMM d, yyyy' })
    }

    if (str === 'iso') {
      return formatDate(date, { ...options, format: "yyyy-MM-dd'T'HH:mm:ss" })
    }

    return formatDate(date, options as DateFormatOptions)
  }

  const num =
    typeof value === 'number'
      ? value
      : typeof value === 'bigint'
        ? Number(value)
        : Number.parseFloat(String(value))

  if (Number.isNaN(num)) {
    return options?.nullFormat ?? ''
  }

  const decimals = /\.(0+)/.exec(str)?.[1]?.length ?? 0
  const compact = /a|abbrev/.test(str)

  if (compact) {
    return formatNumber(num, {
      ...options,
      notation: 'compact',
      compactDisplay: str.includes(' ') ? 'long' : 'short',
      maximumFractionDigits: decimals || 1,
    })
  }

  return formatNumber(num, {
    ...options,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
