import { handleZeroNull, resolveLocale } from './core'
import type { CurrencyFormatOptions } from './types'

/**
 * Format a number as currency with the correct symbol and locale-specific formatting.
 *
 * @param value - The numeric value to format
 * @param options - Optional formatting options
 * @returns Formatted string representing the currency value
 *
 * @example
 * ```ts
 * formatCurrency(1234.56)                      // '$1,234.56'
 * formatCurrency(99.99, { currency: 'EUR' })   // '€99.99'
 * formatCurrency(0, { zeroFormat: 'Free' })    // 'Free'
 * formatCurrency(1234.56, { locale: 'de-DE' }) // '1.234,56 €'
 * ```
 */
export function formatCurrency(value: number, options?: CurrencyFormatOptions): string {
  const result = handleZeroNull(value, options, (valueToFormat) => {
    const locale = resolveLocale(options)
    const formatOptions: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: options?.currency ?? 'USD',
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    }

    return new Intl.NumberFormat(locale, formatOptions).format(valueToFormat)
  })

  const fallbackResult = new Intl.NumberFormat(resolveLocale(options), {
    style: 'currency',
    currency: options?.currency ?? 'USD',
  }).format(value)

  return result ?? fallbackResult
}
