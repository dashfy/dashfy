import { resolveLocale } from './core'
import type { ListFormatOptions } from './types'

/**
 * Format a list of strings.
 *
 * @param items - The list of strings to format
 * @param options - Optional formatting options
 * @returns The formatted list
 *
 * @example
 * ```ts
 * formatList(['A', 'B', 'C'])
 * // => 'A, B, and C'
 *
 * formatList(['A', 'B', 'C'], { type: 'disjunction' })
 * // => 'A, B, or C'
 *
 * formatList(['A', 'B', 'C'], { style: 'short' })
 * // => 'A, B, & C'
 *
 * formatList(['A', 'B', 'C'], { style: 'narrow' })
 * // => 'A, B, C'
 * ```
 */
export function formatList(items: string[], options?: ListFormatOptions): string {
  if (items.length === 0) {
    return ''
  }

  const locale = resolveLocale(options)

  return new Intl.ListFormat(locale, {
    type: options?.type ?? 'conjunction',
    style: options?.style ?? 'long',
  }).format(items)
}
