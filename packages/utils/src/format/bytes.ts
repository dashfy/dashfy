import prettyBytes from 'pretty-bytes'

import { handleZeroNull, resolveLocale } from './core'
import type { BytesFormatOptions } from './types'

/**
 * Format a byte count into a human-readable string.
 *
 * @param value - The byte count to format
 * @param options - Optional formatting options
 * @returns A human-readable string representing the byte count
 *
 * @example
 * ```ts
 * formatBytes(1024)                      // '1.02 kB'
 * formatBytes(1024, { binary: true })    // '1 KiB'
 * formatBytes(8192, { bits: true })      // '8.19 kbit'
 * formatBytes(1024, { locale: 'de-DE' }) // '1,02 kB'
 * ```
 */
export function formatBytes(value: number | bigint, options?: BytesFormatOptions): string {
  const result = handleZeroNull(value, options, (valueToFormat) => {
    const byteCount = typeof valueToFormat === 'bigint' ? Number(valueToFormat) : valueToFormat
    const locale = resolveLocale(options)

    return prettyBytes(byteCount, {
      binary: options?.binary,
      bits: options?.bits,
      signed: options?.signed,
      locale: locale ? (Array.isArray(locale) ? locale[0] : locale) : false,
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits,
    })
  })

  const fallbackValue =
    value === null || value === undefined ? 0 : typeof value === 'bigint' ? Number(value) : value

  return result ?? prettyBytes(fallbackValue)
}

/**
 * Format a byte-rate value into a human-readable per-second string.
 *
 * @param value - The throughput in bytes per second
 * @param options - Optional formatting options (same as {@link formatBytes})
 * @returns A human-readable string representing the throughput
 *
 * @example
 * ```ts
 * formatBytesPerSecond(1024)                   // '1.02 kB/s'
 * formatBytesPerSecond(1024, { binary: true }) // '1 KiB/s'
 * formatBytesPerSecond(0)                      // '0 B/s'
 * ```
 */
export function formatBytesPerSecond(value: number | bigint, options?: BytesFormatOptions): string {
  const result = handleZeroNull(value, options, (valueToFormat) => {
    const byteCount = typeof valueToFormat === 'bigint' ? Number(valueToFormat) : valueToFormat
    const locale = resolveLocale(options)

    return `${prettyBytes(byteCount, {
      binary: options?.binary,
      bits: options?.bits,
      signed: options?.signed,
      locale: locale ? (Array.isArray(locale) ? locale[0] : locale) : false,
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits,
    })}/s`
  })

  const fallbackValue =
    value === null || value === undefined ? 0 : typeof value === 'bigint' ? Number(value) : value

  return result ?? `${prettyBytes(fallbackValue)}/s`
}
