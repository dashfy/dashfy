/**
 * Truncates a string to a specified length and adds an ellipsis if needed.
 *
 * @param str - The string to truncate
 * @param length - The maximum length before truncation (excluding ellipsis)
 * @returns The truncated string with '...' appended, or the original if short enough
 *
 * @example
 * ```ts
 * truncate('Hello, World!', 5)
 * // => 'Hello...'
 *
 * truncate('Short', 10)
 * // => 'Short'
 *
 * // Perfect for long descriptions in UI
 * const description = 'This is a very long description that needs truncation'
 * truncate(description, 20)
 * // => 'This is a very long ...'
 * ```
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) {
    return str
  }

  return `${str.slice(0, length)}...`
}
