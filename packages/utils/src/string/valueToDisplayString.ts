/**
 * Formats a value into a human-readable display string.
 *
 * @param value - The value to format
 * @returns Formatted string representation for display
 *
 * @example
 * ```ts
 * valueToDisplayString(null)           // 'null'
 * valueToDisplayString(undefined)     // 'undefined'
 * valueToDisplayString(true)           // 'true'
 * valueToDisplayString('hello')        // 'hello'
 * valueToDisplayString(42)             // '42'
 * valueToDisplayString([1, 2, 3])      // 'Array(3)'
 * valueToDisplayString({ a: 1, b: 2 }) // 'Object(2)'
 * ```
 */
export function valueToDisplayString(value: unknown): string {
  if (value === null) {
    return 'null'
  }
  if (value === undefined) {
    return 'undefined'
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return `Array(${value.length})`
  }
  if (typeof value === 'object') {
    return `Object(${Object.keys(value as Record<string, unknown>).length})`
  }
  // Fallback for symbols, bigint, etc.
  return String(value as string | number | boolean)
}
