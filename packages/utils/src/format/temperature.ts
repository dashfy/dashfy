import { handleZeroNull, resolveLocale } from './core'
import type { TemperatureFormatOptions } from './types'

/**
 * Format a temperature value.
 *
 * @param value - The temperature value to format
 * @param options - Optional formatting options
 * @returns Formatted string representing the temperature value
 *
 * @example
 * ```ts
 * formatTemperature(25)                         // '25°C'
 * formatTemperature(77, { unit: 'fahrenheit' }) // '77°F'
 * formatTemperature(273.15, { unit: 'kelvin' }) // '273.15 K'
 * ```
 */
export function formatTemperature(value: number, options?: TemperatureFormatOptions): string {
  const result = handleZeroNull(value, options, (valueToFormat) => {
    const locale = resolveLocale(options)
    const unit = options?.unit ?? 'celsius'
    const maxFrac = options?.maximumFractionDigits ?? 0
    const minFrac = options?.minimumFractionDigits

    if (unit === 'kelvin') {
      const opts: Intl.NumberFormatOptions = {
        minimumFractionDigits: minFrac,
        maximumFractionDigits: maxFrac,
      }

      return `${new Intl.NumberFormat(locale, opts).format(valueToFormat)} K`
    }

    const unitKey = unit === 'celsius' ? 'celsius' : 'fahrenheit'
    const opts: Intl.NumberFormatOptions = {
      style: 'unit',
      unit: unitKey,
      minimumFractionDigits: minFrac,
      maximumFractionDigits: maxFrac,
    }

    return new Intl.NumberFormat(locale, opts).format(valueToFormat)
  })

  const fallbackResult = new Intl.NumberFormat(resolveLocale(options), {
    style: 'unit',
    unit: 'celsius',
  }).format(value)

  return result ?? fallbackResult
}
