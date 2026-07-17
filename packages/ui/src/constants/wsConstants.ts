import { WebSocketEvent } from '@dashfy/types'

// Default server configuration
export const DEFAULT_PORT = 5001
export const DEFAULT_HOST = 'localhost'
export const DEFAULT_SERVER_URL = `http://${DEFAULT_HOST}:${DEFAULT_PORT}`

// WebSocket event names
export const WS_CONNECT = WebSocketEvent.CONNECT
export const WS_DISCONNECT = WebSocketEvent.DISCONNECT
export const WS_ERROR = WebSocketEvent.ERROR
export const WS_RECONNECT = WebSocketEvent.RECONNECT
export const WS_RECONNECT_ATTEMPT = WebSocketEvent.RECONNECT_ATTEMPT
export const WS_RECONNECT_ERROR = WebSocketEvent.RECONNECT_ERROR
export const WS_RECONNECT_FAILED = WebSocketEvent.RECONNECT_FAILED

// Custom events
export const WS_CONFIGURATION = WebSocketEvent.CONFIGURATION
export const WS_API_SUBSCRIPTION = WebSocketEvent.API_SUBSCRIPTION
export const WS_API_UNSUBSCRIPTION = WebSocketEvent.API_UNSUBSCRIPTION
export const WS_API_DATA = WebSocketEvent.API_DATA
export const WS_API_ERROR = WebSocketEvent.API_ERROR

// Reconnection settings
export const WS_RECONNECT_DELAY = 1_000
export const WS_RECONNECT_DELAY_MAX = 5_000
export const WS_RECONNECT_ATTEMPTS = 5
export const WS_RECONNECT_BACKOFF_MULTIPLIER = 1.5
