import * as React from 'react'

import { createSubscriptionId } from '@/lib/subscriptionId'
import { useDashfyStore } from '@/store'

export interface UseApiSubscriptionOptions {
  api: string
  endpoint: string
  params?: Record<string, unknown>
  enabled?: boolean
}

/**
 * Hook for subscribing to API data updates via WebSocket connection.
 *
 * Automatically manages subscription lifecycle: creates subscription on mount,
 * sends it to the server when connected, and cleans up on unmount. Returns
 * the current data state including loading and error states.
 *
 * @param options - Subscription configuration
 * @param options.api - API name to subscribe to
 * @param options.endpoint - API endpoint/method to call
 * @param options.params - Optional parameters to pass to the endpoint
 * @param options.enabled - Whether the subscription is active (default: true)
 *
 * @returns Object containing:
 * - `data` - The current data
 * - `error` - The current error
 * - `loading` - Whether the data is loading
 * - `lastUpdate` - The last update timestamp
 *
 * @example
 * ```tsx
 * // No params: subscription ID = "myApi.getData"
 * const { data, error, loading } = useApiSubscription({
 *   api: 'myApi',
 *   endpoint: 'getData',
 *   enabled: true
 * })
 *
 * // Simple param: subscription ID = "myApi.getData.id=123"
 * const { data, error, loading } = useApiSubscription({
 *   api: 'myApi',
 *   endpoint: 'getData',
 *   params: { id: '123' },
 *   enabled: true
 * })
 *
 * // Multiple params: subscription ID = "myApi.getData.user=john.sort=stars.limit=10"
 * const { data, error, loading } = useApiSubscription({
 *   api: 'myApi',
 *   endpoint: 'getData',
 *   params: { user: 'john', sort: 'stars', limit: 10 },
 *   enabled: true
 * })
 * ```
 */
export function useApiSubscription({
  api,
  endpoint,
  params = {},
  enabled = true,
}: UseApiSubscriptionOptions) {
  const socket = useDashfyStore((state) => state.socket)
  const status = useDashfyStore((state) => state.status)
  const subscribeApi = useDashfyStore((state) => state.subscribeApi)
  const unsubscribeApi = useDashfyStore((state) => state.unsubscribeApi)
  const setApiSubscribed = useDashfyStore((state) => state.setApiSubscribed)
  const apiData = useDashfyStore((state) => state.apiData)

  // Generate subscription ID with smart param serialization
  const subscriptionId = createSubscriptionId(api, endpoint, params)

  React.useEffect(() => {
    if (!enabled) {
      return
    }

    // Create subscription
    const subscription = {
      id: subscriptionId,
      api,
      endpoint,
      params,
    }

    // Add to store
    subscribeApi(subscription)

    // Send to server if connected
    if (socket?.connected) {
      socket.emit('api.subscription', subscription)
      setApiSubscribed(subscriptionId)
    }

    // Cleanup
    return () => {
      unsubscribeApi(subscriptionId)

      if (socket?.connected) {
        socket.emit('api.unsubscription', { id: subscriptionId })
      }
    }
  }, [subscriptionId, enabled, socket, status])

  const subscriptionData = apiData[subscriptionId]

  return {
    data: subscriptionData?.data ?? null,
    error: subscriptionData?.error ?? null,
    loading: subscriptionData?.loading ?? true,
    lastUpdate: subscriptionData?.lastUpdate,
  }
}
