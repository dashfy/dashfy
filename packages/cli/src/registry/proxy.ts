import { EnvHttpProxyAgent } from 'undici'

// Native fetch ignores http.Agent-based options, so proxy support goes through
// an undici dispatcher. EnvHttpProxyAgent honors http_proxy/https_proxy/no_proxy.
const proxyDispatcher =
  (process.env.https_proxy ??
  process.env.HTTPS_PROXY ??
  process.env.http_proxy ??
  process.env.HTTP_PROXY)
    ? new EnvHttpProxyAgent()
    : undefined

export async function fetchWithProxy(url: string | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, {
      ...init,
      dispatcher: proxyDispatcher,
    } as RequestInit & { dispatcher?: unknown })
  } catch (error) {
    const cause =
      error instanceof TypeError ? (error as TypeError & { cause?: unknown }).cause : undefined

    if (cause) {
      const enriched = new Error(
        `Request to ${url.toString()} failed, reason: ${getFailureReason(cause)}`,
      ) as Error & { cause?: unknown }
      enriched.cause = cause
      throw enriched
    }

    throw error
  }
}

function getFailureReason(cause: unknown): string {
  if (cause instanceof Error && 'errors' in cause) {
    const errors = (cause as Error & { errors: unknown }).errors
    if (Array.isArray(errors) && errors.length > 0) {
      return getFailureReason(errors[0])
    }
  }

  if (cause instanceof Error) {
    // Prefer a non-empty message; fall back to the error code, hence `||`.
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    return cause.message || (cause as NodeJS.ErrnoException).code || 'unknown error'
  }

  return String(cause)
}
