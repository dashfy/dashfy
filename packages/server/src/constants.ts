// Default server port when not specified in configuration or environment variables
export const DEFAULT_PORT = 5001

// Default server host when not specified in configuration or environment variables
// Using '0.0.0.0' allows connections from any network interface
export const DEFAULT_HOST = '0.0.0.0'

// Default polling interval for API calls in milliseconds (15 seconds)
// Used when no specific poll interval is configured
export const DEFAULT_POLL_INTERVAL = 15_000

// Default push interval for API calls in milliseconds (2 seconds)
// Used when no specific push interval is configured
export const DEFAULT_PUSH_INTERVAL = 2_000

// Socket.IO ping timeout in milliseconds (60 seconds)
// The server will close the connection if no pong is received within this time
export const SOCKET_PING_TIMEOUT = 60_000

// Socket.IO ping interval in milliseconds (25 seconds)
// How often the server sends a ping packet to the client
export const SOCKET_PING_INTERVAL = 25_000

// Default request timeout in milliseconds (10 seconds)
export const DEFAULT_REQUEST_TIMEOUT = 10_000
