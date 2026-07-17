import { handleZeroNull, resolveLocale } from './core'
import type { PercentFormatOptions } from './types'

/**
 * Format a number as a percentage.
 *
 * @param value - The number to format
 * @param options - Optional formatting options
 * @returns Formatted string representing the percentage value
 *
 * @example
 * ```ts
 * formatPercent(0.5)
 * // => '50%'
 *
 * formatPercent(0.5, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
 * // => '50.00%'
 *
 * formatPercent(50, { scaleBy100: false })
 * // => '50%' (value already 0–100)
 * ```
 */
export function formatPercent(value: number, options?: PercentFormatOptions): string {
  const result = handleZeroNull(value, options, (valueToFormat) => {
    const toFormat = options?.scaleBy100 !== false ? valueToFormat : valueToFormat / 100
    const locale = resolveLocale(options)
    const opts: Intl.NumberFormatOptions = {
      style: 'percent',
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    }

    return new Intl.NumberFormat(locale, opts).format(toFormat)
  })

  const fallbackResult = new Intl.NumberFormat(resolveLocale(options), { style: 'percent' }).format(
    value,
  )

  return result ?? fallbackResult
}
