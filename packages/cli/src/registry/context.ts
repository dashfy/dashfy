/**
 * Per-run store of HTTP headers keyed by resolved registry URL. Lets the
 * resolver attach auth headers (from custom registry config) to the exact URLs
 * they apply to, including nested dependencies.
 */
interface RegistryContext {
  headers: Record<string, Record<string, string>>
}

const context: RegistryContext = {
  headers: {},
}

export function setRegistryHeaders(headers: Record<string, Record<string, string>>): void {
  context.headers = { ...context.headers, ...headers }
}

export function getRegistryHeadersFromContext(url: string): Record<string, string> {
  return context.headers[url] ?? {}
}

export function clearRegistryContext(): void {
  context.headers = {}
}
