import type { RequestOptions } from '@getdashfy/types'
import { request as undiciRequest } from 'undici'

import { DEFAULT_REQUEST_TIMEOUT } from './constants'

/**
 * Makes an HTTP request and returns the parsed JSON response.
 *
 * @param options - Request configuration
 * @returns Parsed JSON response
 * @throws Error if request fails or response is not valid JSON
 *
 * @example
 * ```ts
 * // Simple GET request
 * const data = await request({ url: 'https://api.example.com/data' })
 *
 * // POST with body
 * const result = await request({
 *   url: 'https://api.example.com/items',
 *   method: 'POST',
 *   body: { name: 'New Item' },
 *   headers: { 'Authorization': 'Bearer token' }
 * })
 * ```
 */
export async function request(options: RequestOptions): Promise<unknown> {
  const { url, method = 'GET', headers = {}, body, timeout = DEFAULT_REQUEST_TIMEOUT } = options

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  }

  const response = await undiciRequest(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    headersTimeout: timeout,
    bodyTimeout: timeout,
  })

  if (response.statusCode >= 400) {
    const errorBody = await response.body.text().catch(() => '')
    throw new Error(`HTTP ${response.statusCode}: ${errorBody || 'Request failed'}`)
  }

  return response.body.json()
}
