import type * as React from 'react'

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export enum WebSocketStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

export enum WebSocketEvent {
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',
  CONFIGURATION = 'configuration',
  RECONNECT = 'reconnect',
  RECONNECT_ATTEMPT = 'reconnect_attempt',
  RECONNECT_ERROR = 'reconnect_error',
  RECONNECT_FAILED = 'reconnect_failed',
  API_SUBSCRIPTION = 'api.subscription',
  API_UNSUBSCRIPTION = 'api.unsubscription',
  API_DATA = 'api.data',
  API_ERROR = 'api.error',
}

export type APIClient = Record<string, (...args: any[]) => Promise<unknown>>

export type CreatePushInterval = (options?: {
  interval?: number
}) => (
  key: string,
  callback: (data: unknown) => void,
  fetchFn: () => Promise<unknown>,
) => () => void

export type APIRegistration = (dashfy: {
  logger: Logger
  request?: (options: RequestOptions) => Promise<unknown>
  createPushInterval?: CreatePushInterval
}) => APIClient

export type ApiConfig = Record<string, unknown>

export type Dashboard = DashboardConfig

export type Extension = Record<string, WidgetComponent | React.ComponentType<any>>

export type PollMode = 'poll' | 'push'

export type ThemeId = string

export type ThemeMode = 'light' | 'dark'

export interface ApiData<T = unknown> {
  data: T | null
  error: string | null
  loading: boolean
  lastUpdate: number
}

export interface ApiError {
  id: string
  error: {
    message: string
    code?: string
    statusCode?: number
  }
}

export interface DashboardConfig {
  name?: string
  title?: string
  columns: number
  rows: number
  widgets: WidgetConfig[]
}

export interface DashfyConfig {
  port?: number
  host?: string
  baseDir?: string
  theme?: ThemeId
  rotationDuration?: number
  dashboards: DashboardConfig[]
  apis?: {
    pollInterval?: number
    [key: string]: ApiConfig | number | undefined
  }
}

export interface Logger {
  info: (message: string, ...args: any[]) => void
  warn: (message: string, ...args: any[]) => void
  error: (message: string, ...args: any[]) => void
  debug: (message: string, ...args: any[]) => void
}

export interface Notification {
  id: string
  type: NotificationType
  message: string
  /**
   * Time To Live in milliseconds - how long before auto-dismissing
   * - positive number: auto-dismiss after this many ms
   * - -1 or 0: never auto-dismiss (user must manually close)
   * - undefined: uses default TTL based on notification type
   */
  ttl?: number
  action?: {
    label: string
    onClick: () => void
  }
  createdAt: number
}

export interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  timeout?: number
}

export interface Subscription {
  id: string
  api: string
  endpoint: string
  params?: Record<string, unknown>
  hasSubscribed?: boolean
}

export interface WidgetComponent<P = any> {
  (props: P): React.ReactNode
  displayName?: string
  getApiRequest?: (props: P) => Subscription
}

export interface WidgetConfig {
  extension: string
  widget: string
  title?: string
  columns: number
  rows: number
  x: number
  y: number
  [key: string]: unknown
}

export interface WidgetMetadata {
  displayName: string
  description?: string
  defaultConfig?: Record<string, unknown>
  previewImage?: string
  requiredApis?: string[]
}

export interface WidgetProps<T = unknown> {
  apiData?: T
  apiError?: Error
  isLoading?: boolean
}

export interface WidgetRegistryEntry {
  component: WidgetComponent
  metadata?: WidgetMetadata
}
