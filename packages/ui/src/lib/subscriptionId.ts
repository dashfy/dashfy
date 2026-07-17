/**
 * Serializes parameters into a human-readable string for subscription IDs.
 *
 * Rules:
 * - Empty params → empty string
 * - Single or multiple params → "key=value" pairs joined by "."
 *
 * @param params - Parameters object to serialize
 * @returns Serialized string or empty string
 *
 * @example
 * ```ts
 * serializeParams({}) // ""
 * serializeParams({ url: "https://api.com" }) // "url=https://api.com"
 * serializeParams({ user: "john", sort: "stars" }) // "user=john.sort=stars"
 * ```
 */
export function serializeParams(params: Record<string, unknown>): string {
  const keys = Object.keys(params)

  // No params
  if (keys.length === 0) {
    return ''
  }

  // Build key=value pairs for all params
  const pairs = keys.map((key) => {
    const value = params[key]

    // Stringify complex values (objects, arrays)
    if (typeof value === 'object' && value !== null) {
      return `${key}=${JSON.stringify(value)}`
    }

    return `${key}=${String(value)}`
  })

  return pairs.join('.')
}

/**
 * Creates a unique subscription ID from API name, endpoint, and parameters.
 *
 * Format:
 * - No params: "api.endpoint"
 * - With params: "api.endpoint.serializedParams"
 *
 * @param api - API name
 * @param endpoint - Endpoint/method name
 * @param params - Optional parameters
 * @returns Unique subscription ID
 *
 * @example
 * ```ts
 * createSubscriptionId('demo', 'getCounter') // "demo.getCounter"
 * createSubscriptionId('json', 'get', { url: 'https://...' }) // "json.get.url=https://..."
 * createSubscriptionId('github', 'repos', { user: 'john', sort: 'stars' }) // "github.repos.user=john.sort=stars"
 * ```
 */
export function createSubscriptionId(
  api: string,
  endpoint: string,
  params?: Record<string, unknown>,
): string {
  const serializedParams = params ? serializeParams(params) : ''

  return serializedParams ? `${api}.${endpoint}.${serializedParams}` : `${api}.${endpoint}`
}
