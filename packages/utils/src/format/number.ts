import { handleZeroNull, resolveLocale } from './core'
import type { NumberFormatOptions } from './types'

/**
 * Format a number with locale-aware thousands separators and optional decimals.
 *
 * @param value - The number to format
 * @param options - Optional formatting options
 * @returns Formatted string representing the number
 *
 * @example
 * ```ts
 * formatNumber(1234.56)
 * // => '1,234.56'
 *
 * formatNumber(1234.56, { maximumFractionDigits: 2 })
 * // => '1,234.56'
 *
 * formatNumber(1234.56, { notation: 'compact' })
 * // => '1.2K'
 *
 * formatNumber(1234.56, { notation: 'compact', compactDisplay: 'long' })
 * // => '1.2 thousand'
 * ```
 */
export function formatNumber(value: number, options?: NumberFormatOptions): string {
  const result = handleZeroNull(value, options, (valueToFormat) => {
    const locale = resolveLocale(options)
    const opts: Intl.NumberFormatOptions = {
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits ?? (valueToFormat % 1 === 0 ? 0 : 2),
      ...(options?.notation && { notation: options.notation }),
      ...(options?.compactDisplay && { compactDisplay: options.compactDisplay }),
    }

    return new Intl.NumberFormat(locale, opts).format(valueToFormat)
  })

  const fallbackResult = new Intl.NumberFormat(resolveLocale(options)).format(value)

  return result ?? fallbackResult
}
