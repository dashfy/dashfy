import type { DashfyConfig } from '@dashfy/types'
import { WebSocketStatus } from '@dashfy/types'
import * as React from 'react'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'

import {
  WS_RECONNECT_ATTEMPTS,
  WS_RECONNECT_DELAY,
  WS_RECONNECT_DELAY_MAX,
} from '@/constants/wsConstants'
import { cleanupWebSocketHandlers, setupWebSocketHandlers } from '@/lib/WSHelper'
import { useDashfyStore } from '@/store'

import { useNotifications } from './useNotifications'

export interface UseWebSocketOptions {
  url: string
  autoConnect?: boolean
  reconnect?: boolean
}

/**
 * Hook for managing WebSocket connection lifecycle with automatic reconnection.
 *
 * Establishes and maintains a Socket.IO connection to the Dashfy server, handling
 * connection state, reconnection logic, and automatic resubscription of API endpoints
 * on reconnect. Integrates with the store to sync configuration, API data, and
 * subscription states.
 *
 * @param options - WebSocket configuration options
 * @param options.url - Server URL to connect to
 * @param options.autoConnect - Whether to connect automatically on mount (default: true)
 * @param options.reconnect - Whether to automatically reconnect on disconnect (default: true)
 *
 * @returns Socket.IO client instance or null if not connected
 *
 * @example
 * ```tsx
 * function App() {
 *   const socket = useWebSocket({
 *     url: 'http://localhost:5001',
 *     autoConnect: true,
 *     reconnect: true
 *   })
 *
 *   if (!socket) {
 *     return <div>Connecting...</div>
 *   }
 *
 *   return <Dashboard />
 * }
 * ```
 */
export function useWebSocket({
  url,
  autoConnect = true,
  reconnect = true,
}: UseWebSocketOptions): Socket | null {
  const socketRef = React.useRef<Socket | null>(null)

  const setSocket = useDashfyStore((state) => state.setSocket)
  const setStatus = useDashfyStore((state) => state.setStatus)
  const setConfig = useDashfyStore((state) => state.setConfig)
  const setDashboards = useDashfyStore((state) => state.setDashboards)
  const setApiData = useDashfyStore((state) => state.setApiData)
  const setApiError = useDashfyStore((state) => state.setApiError)
  const setAllApiUnsubscribed = useDashfyStore((state) => state.setAllApiUnsubscribed)
  const getApiPendingSubscriptions = useDashfyStore((state) => state.getApiPendingSubscriptions)
  const setApiSubscribed = useDashfyStore((state) => state.setApiSubscribed)
  const { notifySuccess, notifyError } = useNotifications()

  React.useEffect(() => {
    if (!autoConnect) {
      return
    }

    // Create socket
    const socket = io(url, {
      reconnection: reconnect,
      reconnectionDelay: WS_RECONNECT_DELAY,
      reconnectionDelayMax: WS_RECONNECT_DELAY_MAX,
      reconnectionAttempts: WS_RECONNECT_ATTEMPTS,
    })

    socketRef.current = socket
    setSocket(socket)
    setStatus(WebSocketStatus.CONNECTING)

    // Setup handlers
    setupWebSocketHandlers(socket, {
      onConnect: () => {
        setStatus(WebSocketStatus.CONNECTED)
        notifySuccess('Connected to server')

        // Send pending subscriptions
        const pending = getApiPendingSubscriptions()
        pending.forEach((subscription) => {
          socket.emit('api.subscription', subscription)
          setApiSubscribed(subscription.id)
        })
      },

      onDisconnect: () => {
        setStatus(WebSocketStatus.DISCONNECTED)
        notifyError('Disconnected from server')
        setAllApiUnsubscribed()
      },

      onError: (error) => {
        setStatus(WebSocketStatus.ERROR)
        notifyError(`WebSocket error: ${error.message}`)
      },

      onConfiguration: (config: unknown) => {
        const dashfyConfig = config as DashfyConfig
        setConfig(dashfyConfig)
        setDashboards(dashfyConfig.dashboards)
      },

      onApiData: ({ id, data }: { id: string; data: unknown }) => {
        setApiData(id, data)
      },

      onApiError: ({ id, error }: { id: string; error: { message: string } }) => {
        setApiError(id, error.message)
      },
    })

    // Cleanup
    return () => {
      cleanupWebSocketHandlers(socket)
      socket.close()
      setSocket(null)
      setStatus(WebSocketStatus.DISCONNECTED)
    }
  }, [url, autoConnect, reconnect])

  return socketRef.current
}
