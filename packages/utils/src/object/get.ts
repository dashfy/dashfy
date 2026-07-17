/**
 * Safely retrieves a nested property value from an object using a dot-notation path.
 *
 * This function provides a safe way to access deeply nested properties without
 * worrying about undefined intermediate values. Similar to lodash's `_.get()`.
 * Returns `undefined` if any part of the path doesn't exist.
 *
 * @param obj - The object to query
 * @param path - The dot-notation path to the property (e.g., 'user.address.city')
 * @returns The value at the path, or `undefined` if not found
 *
 * @example
 * ```ts
 * const user = { name: 'John', address: { city: 'NYC', zip: '10001' } }
 *
 * get(user, 'name')
 * // => 'John'
 * ```
 *
 * @example
 * ```ts
 * get(user, 'address.city')
 * // => 'NYC'
 * ```
 *
 * @example
 * ```ts
 * // Safe access - returns undefined instead of throwing
 * get(user, 'address.country')
 * // => undefined
 * ```
 *
 * @example
 * ```ts
 * get(user, 'profile.avatar.url')
 * // => undefined (profile doesn't exist)
 * ```
 *
 * @example
 * ```ts
 * // Perfect for widget data access
 * const widgetData = { metrics: { cpu: { usage: 75 } } }
 * get(widgetData, 'metrics.cpu.usage')
 * // => 75
 * ```
 */
export function get(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split('.')
  let result: unknown = obj

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key]
    } else {
      return undefined
    }
  }

  return result
}
