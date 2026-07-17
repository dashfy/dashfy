import { handleZeroNull, resolveLocale } from './core'
import type { ExponentialFormatOptions } from './types'

/**
 * Format a number in exponential/scientific notation.
 *
 * @param value - The number to format
 * @param options - Optional formatting options
 * @returns Formatted string representing the exponential value
 *
 * @example
 * ```ts
 * formatExponential(1234.56)                               // '1.23E3'
 * formatExponential(1234.56, { maximumFractionDigits: 0 }) // '1E3'
 * formatExponential(0.00123)                               // '1.23E-3'
 * formatExponential(1234.56, { locale: 'de-DE' })          // '1,23E3'
 * formatExponential(0, { zeroFormat: '0' })                // '0'
 * ```
 */
export function formatExponential(value: number, options?: ExponentialFormatOptions): string {
  const result = handleZeroNull(value, options, (valueToFormat) => {
    const locale = resolveLocale(options)
    const formatOptions: Intl.NumberFormatOptions = {
      notation: 'scientific',
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    }

    return new Intl.NumberFormat(locale, formatOptions).format(valueToFormat)
  })

  const fallbackResult = new Intl.NumberFormat(resolveLocale(options), {
    notation: 'scientific',
  }).format(value)

  return result ?? fallbackResult
}
