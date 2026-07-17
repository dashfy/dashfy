/**
 * Converts any value to a string representation (primitives as-is, objects as JSON).
 *
 * @param value - The value to convert to a string
 * @returns A string representation of the value
 *
 * @example
 * ```ts
 * stringifyValue(null)
 * // => ''
 *
 * stringifyValue(undefined)
 * // => ''
 *
 * stringifyValue('hello')
 * // => 'hello'
 *
 * stringifyValue(42)
 * // => '42'
 *
 * stringifyValue(true)
 * // => 'true'
 *
 * stringifyValue({ name: 'John', age: 30 })
 * // => '{"name":"John","age":30}'
 *
 * stringifyValue([1, 2, 3])
 * // => '[1,2,3]'
 * ```
 */
export function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  return JSON.stringify(value)
}
