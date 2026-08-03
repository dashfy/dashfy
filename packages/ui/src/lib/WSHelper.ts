import { isServer } from '@getdashfy/utils'
import type { Socket } from 'socket.io-client'

import {
  WS_API_DATA,
  WS_API_ERROR,
  WS_CONFIGURATION,
  WS_CONNECT,
  WS_CONNECT_ERROR,
  WS_DISCONNECT,
  WS_RECONNECT,
  WS_RECONNECT_ATTEMPT,
  WS_RECONNECT_ERROR,
  WS_RECONNECT_FAILED,
} from '@/constants/wsConstants'

/**
 * Automatically determines the WebSocket URL based on the current browser location.
 *
 * This function intelligently constructs the WebSocket URL by:
 * - Detecting the protocol (ws:// or wss://) based on the page's protocol
 * - Using the current hostname
 * - Preserving or overriding the port number
 *
 * @param config - Optional configuration object
 * @param config.useWssConnection - Force secure WebSocket (wss://) connection
 * @param config.wsPort - Override the port number for the WebSocket connection
 * @returns The constructed WebSocket URL (e.g., "ws://localhost:3000" or "wss://example.com")
 * @throws {Error} When running in a non-browser environment (e.g., SSR, Node.js)
 *
 * @example
 * ```ts
 * // Auto-detect from current page
 * const url = guessWSURL()
 *
 * // Force secure connection on a specific port
 * const url = guessWSURL({ useWssConnection: true, wsPort: 8080 })
 * ```
 */
export function guessWSURL(config?: { useWssConnection?: boolean; wsPort?: number }): string {
  if (isServer || !window.document?.location) {
    throw new Error(
      `Unable to guess websocket URL because 'window.document.location' is not defined`,
    )
  }

  let proto = 'ws'
  if (config?.useWssConnection === true || window.document.location.protocol === 'https:') {
    proto = 'wss'
  }

  let port = window.document.location.port
  if (config?.wsPort !== undefined) {
    port = String(config.wsPort)
  }

  let wsUrl = `${proto}://${window.document.location.hostname}`
  if (port && port !== '') {
    wsUrl = `${wsUrl}:${port}`
  }

  return wsUrl
}

/**
 * Registers standard event handlers for the WebSocket connection.
 *
 * This helper function streamlines the setup of common WebSocket event listeners
 * used throughout the Dashfy framework. It handles connection lifecycle events
 * and custom application events for configuration and API data streaming.
 *
 * Reconnection events are emitted by the Socket.IO Manager (`socket.io`) rather than the
 * socket itself, so they are registered there. Registering them on the socket compiles but
 * never fires.
 *
 * @param socket - The Socket.IO client instance
 * @param handlers - Object containing optional event handler callbacks
 * @param handlers.onConnect - Called when the WebSocket connection is established
 * @param handlers.onDisconnect - Called when the WebSocket connection is closed
 * @param handlers.onError - Called when the connection attempt fails
 * @param handlers.onReconnect - Called when a reconnection succeeds
 * @param handlers.onReconnectAttempt - Called before each reconnection attempt
 * @param handlers.onReconnectError - Called when a reconnection attempt fails
 * @param handlers.onReconnectFailed - Called when all reconnection attempts are exhausted
 * @param handlers.onConfiguration - Called when configuration data is received
 * @param handlers.onApiData - Called when API data is received for a widget
 * @param handlers.onApiError - Called when an API error occurs for a widget
 *
 * @example
 * ```ts
 * setupWebSocketHandlers(socket, {
 *   onConnect: () => console.log('Connected!'),
 *   onDisconnect: () => console.log('Disconnected'),
 *   onReconnectAttempt: (attempt) => console.log(`Retrying (${attempt})`),
 *   onApiData: ({ id, data }) => updateWidget(id, data),
 *   onApiError: ({ id, error }) => handleWidgetError(id, error)
 * })
 * ```
 */
export function setupWebSocketHandlers(
  socket: Socket,
  handlers: {
    onConnect?: () => void
    onDisconnect?: () => void
    onError?: (error: Error) => void
    onReconnect?: (attempt: number) => void
    onReconnectAttempt?: (attempt: number) => void
    onReconnectError?: (error: Error) => void
    onReconnectFailed?: () => void
    onConfiguration?: (config: unknown) => void
    onApiData?: (payload: { id: string; data: unknown }) => void
    onApiError?: (payload: { id: string; error: { message: string } }) => void
  },
): void {
  if (handlers.onConnect) {
    socket.on(WS_CONNECT, handlers.onConnect)
  }

  if (handlers.onDisconnect) {
    socket.on(WS_DISCONNECT, handlers.onDisconnect)
  }

  if (handlers.onError) {
    socket.on(WS_CONNECT_ERROR, handlers.onError)
  }

  if (handlers.onReconnect) {
    socket.io.on(WS_RECONNECT, handlers.onReconnect)
  }

  if (handlers.onReconnectAttempt) {
    socket.io.on(WS_RECONNECT_ATTEMPT, handlers.onReconnectAttempt)
  }

  if (handlers.onReconnectError) {
    socket.io.on(WS_RECONNECT_ERROR, handlers.onReconnectError)
  }

  if (handlers.onReconnectFailed) {
    socket.io.on(WS_RECONNECT_FAILED, handlers.onReconnectFailed)
  }

  if (handlers.onConfiguration) {
    socket.on(WS_CONFIGURATION, handlers.onConfiguration)
  }

  if (handlers.onApiData) {
    socket.on(WS_API_DATA, handlers.onApiData)
  }

  if (handlers.onApiError) {
    socket.on(WS_API_ERROR, handlers.onApiError)
  }
}

/**
 * Removes all registered event handlers from the WebSocket connection.
 *
 * This function unregisters all standard Dashfy event listeners to prevent
 * memory leaks and duplicate event handlers. Should be called when a component
 * unmounts or before re-registering handlers.
 *
 * Manager listeners are removed separately from socket listeners because the Manager
 * outlives individual sockets, so leaving them attached accumulates duplicates across
 * remounts.
 *
 * Events removed:
 * - connect
 * - disconnect
 * - connect_error
 * - reconnect, reconnect_attempt, reconnect_error, reconnect_failed (Manager)
 * - configuration
 * - api.data
 * - api.error
 *
 * @param socket - The Socket.IO client instance to clean up
 *
 * @example
 * ```ts
 * useEffect(() => {
 *   setupWebSocketHandlers(socket, handlers)
 *
 *   return () => {
 *     cleanupWebSocketHandlers(socket)
 *   }
 * }, [socket])
 * ```
 */
export function cleanupWebSocketHandlers(socket: Socket): void {
  socket.off(WS_CONNECT)
  socket.off(WS_DISCONNECT)
  socket.off(WS_CONNECT_ERROR)
  socket.off(WS_CONFIGURATION)
  socket.off(WS_API_DATA)
  socket.off(WS_API_ERROR)

  socket.io.off(WS_RECONNECT)
  socket.io.off(WS_RECONNECT_ATTEMPT)
  socket.io.off(WS_RECONNECT_ERROR)
  socket.io.off(WS_RECONNECT_FAILED)
}
