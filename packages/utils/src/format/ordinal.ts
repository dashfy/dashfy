import { handleZeroNull, resolveLocale } from './core'
import type { OrdinalFormatOptions } from './types'

/**
 * Format a number with ordinal suffix.
 *
 * @param value - The number to format
 * @param options - Optional formatting options
 * @returns Formatted string representing the ordinal value
 *
 * @example
 * ```ts
 * formatOrdinal(1) // '1st'
 * formatOrdinal(2) // '2nd'
 * formatOrdinal(3) // '3rd'
 */
export function formatOrdinal(value: number, options?: OrdinalFormatOptions): string {
  const result = handleZeroNull(value, options, (valueToFormat) => {
    const locale = resolveLocale(options)
    const roundedValue = Math.round(valueToFormat)
    const intl = new Intl.NumberFormat(locale, {
      minimumFractionDigits: options?.minimumFractionDigits,
      maximumFractionDigits: options?.maximumFractionDigits ?? 0,
    })
    const ord =
      typeof Intl.PluralRules !== 'undefined'
        ? new Intl.PluralRules(locale, { type: 'ordinal' }).select(roundedValue)
        : 'other'
    const suffixes: Record<string, string> = {
      one: 'st',
      two: 'nd',
      few: 'rd',
      other: 'th',
    }

    /* v8 ignore next */
    return `${intl.format(roundedValue)}${suffixes[ord] ?? 'th'}`
  })

  return result ?? `${value}th`
}
