/**
 * Core utilities shared across format modules.
 */

let defaultLocale: string | string[] | undefined

/**
 * Set the default locale for all format functions.
 *
 * When a format is called without `locale` in its options, it uses this value.
 * Call at app startup or in tests for consistent output (e.g. `setDefaultLocale('en-US')`).
 *
 * @param locale - BCP 47 locale (e.g. 'en-US'), an array of fallbacks, or `undefined` to use runtime default
 */
export function setDefaultLocale(locale: string | string[] | undefined): void {
  defaultLocale = locale
}

/**
 * Get the current default locale.
 *
 * @returns The default locale, or `undefined` if none is set
 */
export function getDefaultLocale(): string | string[] | undefined {
  return defaultLocale
}

/**
 * Resolve which locale to use for formatting.
 *
 * Uses `options.locale` when present, otherwise falls back to the default locale.
 * Format functions use this before passing locale to Intl APIs.
 *
 * @param options - Format options that may include a `locale` override
 * @returns The locale to use, or `undefined` if neither options nor default are set
 */
export function resolveLocale(options?: {
  locale?: string | string[]
}): string | string[] | undefined {
  return options?.locale ?? defaultLocale
}

/**
 * Handle zero and null/undefined before delegating to the formatter.
 *
 * - If value is null/undefined: return `nullFormat` when set, otherwise `null`
 * - If value is 0: return `zeroFormat` when set, otherwise format normally
 * - Otherwise: call formatFn with the value
 *
 * @param value - The value to format (may be null or undefined)
 * @param options - Optional `zeroFormat` and `nullFormat` for custom output
 * @param formatFn - The formatter to call when value is valid and non-zero
 * @returns Custom string, `null`, or the formatted value
 *
 * @example
 * ```ts
 * handleZeroNull(100, { zeroFormat: '0' }, (v) => v.toString())
 * // => '100'
 *
 * handleZeroNull(0, { zeroFormat: '0' }, (v) => v.toString())
 * // => '0'
 *
 * handleZeroNull(null, { nullFormat: 'N/A' }, (v) => v.toString())
 * // => 'N/A'
 *
 * handleZeroNull(undefined, { nullFormat: 'N/A' }, (v) => v.toString())
 * // => 'N/A'
 * ```
 */
export function handleZeroNull<T>(
  value: T | null | undefined,
  options: { zeroFormat?: string; nullFormat?: string } | undefined,
  formatFn: (valueToFormat: T) => string,
): string | null {
  if (value === null || value === undefined) {
    if (options?.nullFormat !== undefined) {
      return options.nullFormat
    }

    return null
  }

  if (typeof value === 'number' && value === 0 && options?.zeroFormat !== undefined) {
    return options.zeroFormat
  }

  return formatFn(value as T)
}
