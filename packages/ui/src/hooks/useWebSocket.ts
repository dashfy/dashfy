import type { DashfyConfig } from '@getdashfy/types'
import { WebSocketStatus } from '@getdashfy/types'
import * as React from 'react'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'

import {
  WS_DISCONNECT_NOTIFY_DELAY,
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
 * @remarks
 * Reconnection is unbounded. Dashboards are long-lived displays, so a capped retry count
 * would leave them permanently dead after an outage until someone reloads the page.
 * Outage notifications are debounced by {@link WS_DISCONNECT_NOTIFY_DELAY} and announced
 * at most once per episode, so routine server restarts stay silent.
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
  const offlineNotifyTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const offlineNotificationIdRef = React.useRef<string | null>(null)
  const offlineNotifiedRef = React.useRef(false)
  const hasConnectedRef = React.useRef(false)

  const setSocket = useDashfyStore((state) => state.setSocket)
  const setStatus = useDashfyStore((state) => state.setStatus)
  const setConfig = useDashfyStore((state) => state.setConfig)
  const setDashboards = useDashfyStore((state) => state.setDashboards)
  const setApiData = useDashfyStore((state) => state.setApiData)
  const setApiError = useDashfyStore((state) => state.setApiError)
  const setAllApiUnsubscribed = useDashfyStore((state) => state.setAllApiUnsubscribed)
  const getApiPendingSubscriptions = useDashfyStore((state) => state.getApiPendingSubscriptions)
  const setApiSubscribed = useDashfyStore((state) => state.setApiSubscribed)
  const setReconnectAttempt = useDashfyStore((state) => state.setReconnectAttempt)
  const resetReconnectAttempt = useDashfyStore((state) => state.resetReconnectAttempt)
  const { notifySuccess, notifyError, removeNotification } = useNotifications()

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

    const clearOfflineNotify = () => {
      if (offlineNotifyTimerRef.current) {
        clearTimeout(offlineNotifyTimerRef.current)
        offlineNotifyTimerRef.current = null
      }

      // Outage notifications never auto-dismiss, so drop the resolved one rather than
      // leaving a stale "disconnected" entry in the notifications panel.
      if (offlineNotificationIdRef.current) {
        removeNotification(offlineNotificationIdRef.current)
        offlineNotificationIdRef.current = null
      }
    }

    // Hold the toast back so brief blips and server restarts stay silent, and only
    // ever announce an outage once per episode.
    const scheduleOfflineNotify = (message: string) => {
      if (offlineNotifyTimerRef.current || offlineNotifiedRef.current) {
        return
      }

      offlineNotifyTimerRef.current = setTimeout(() => {
        offlineNotifyTimerRef.current = null

        // A late stray disconnect event must not announce an outage we already recovered from.
        if (socket.connected) {
          return
        }

        offlineNotifiedRef.current = true
        offlineNotificationIdRef.current = notifyError(message)
      }, WS_DISCONNECT_NOTIFY_DELAY)
    }

    // Setup handlers
    setupWebSocketHandlers(socket, {
      onConnect: () => {
        setStatus(WebSocketStatus.CONNECTED)
        resetReconnectAttempt()
        clearOfflineNotify()

        if (!hasConnectedRef.current) {
          hasConnectedRef.current = true
          notifySuccess('Connected to server')
        } else if (offlineNotifiedRef.current) {
          notifySuccess('Reconnected to server')
        }

        offlineNotifiedRef.current = false

        // Send pending subscriptions
        const pending = getApiPendingSubscriptions()
        pending.forEach((subscription) => {
          socket.emit('api.subscription', subscription)
          setApiSubscribed(subscription.id)
        })
      },

      onDisconnect: () => {
        setAllApiUnsubscribed()

        // Socket.IO begins retrying immediately, so reconnecting is the truthful state.
        setStatus(reconnect ? WebSocketStatus.RECONNECTING : WebSocketStatus.DISCONNECTED)
        scheduleOfflineNotify('Disconnected from server')
      },

      onError: (error) => {
        // Fires once per failed attempt, so this must not notify per attempt nor
        // claim a terminal error while retries are still in flight.
        setStatus(reconnect ? WebSocketStatus.RECONNECTING : WebSocketStatus.ERROR)
        scheduleOfflineNotify(`Unable to connect to server: ${error.message}`)
      },

      onReconnectAttempt: (attempt) => {
        setStatus(WebSocketStatus.RECONNECTING)
        setReconnectAttempt(attempt)
      },

      onReconnectFailed: () => {
        clearOfflineNotify()
        setStatus(WebSocketStatus.ERROR)
        notifyError('Unable to reconnect to server')
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
      clearOfflineNotify()
      offlineNotifiedRef.current = false
      hasConnectedRef.current = false

      cleanupWebSocketHandlers(socket)
      socket.close()
      setSocket(null)
      setStatus(WebSocketStatus.DISCONNECTED)
      resetReconnectAttempt()
    }
  }, [url, autoConnect, reconnect])

  return socketRef.current
}
