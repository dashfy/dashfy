import type {
  ApiData,
  Dashboard,
  DashfyConfig,
  Notification,
  Subscription,
  ThemeId,
  WebSocketStatus,
} from '@dashfy/types'
import type { Socket } from 'socket.io-client'

export interface DashfyStore
  extends ConfigurationSlice,
    DashboardsSlice,
    ApiSlice,
    WsSlice,
    ThemesSlice,
    NotificationsSlice,
    PanelSlice,
    SettingsSlice {}

export interface ConfigurationSlice {
  config: DashfyConfig | null
  isLoading: boolean
  error: string | null
  setConfig: (config: DashfyConfig) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchConfig: () => Promise<void>
}

export interface DashboardsSlice {
  dashboards: Dashboard[]
  currentDashboard: number
  isPlaying: boolean
  setDashboards: (dashboards: Dashboard[]) => void
  setCurrentDashboard: (index: number) => void
  nextDashboard: () => void
  previousDashboard: () => void
  play: () => void
  pause: () => void
  togglePlay: () => void
}

export interface ApiSlice {
  apiSubscriptions: Map<string, Subscription>
  apiData: Record<string, ApiData>
  subscribeApi: (subscription: Subscription) => void
  unsubscribeApi: (id: string) => void
  setApiSubscribed: (id: string) => void
  setAllApiUnsubscribed: () => void
  setApiData: (id: string, data: unknown) => void
  setApiError: (id: string, error: string) => void
  setApiLoading: (id: string, loading: boolean) => void
  getApiPendingSubscriptions: () => Subscription[]
  hasApiSubscription: (id: string) => boolean
  clearApiData: (id: string) => void
}

export interface WsSlice {
  socket: Socket | null
  status: WebSocketStatus
  reconnectAttempt: number
  setSocket: (socket: Socket | null) => void
  setStatus: (status: WebSocketStatus) => void
  setReconnectAttempt: (attempt: number) => void
  incrementReconnectAttempt: () => void
  resetReconnectAttempt: () => void
}

export interface ThemesSlice {
  currentTheme: ThemeId | null
  availableThemes: ThemeId[]
  setTheme: (themeId: ThemeId) => void
  setAvailableThemes: (themes: ThemeId[]) => void
}

export interface NotificationsSlice {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string
  removeNotification: (id: string) => void
  clearNotifications: () => void
  notifySuccess: (message: string, ttl?: number) => string
  notifyError: (message: string, ttl?: number) => string
  notifyWarning: (message: string, ttl?: number) => string
  notifyInfo: (message: string, ttl?: number) => string
}

export interface PanelSlice {
  isPanelOpen: boolean
  panelHeight: number
  activeTab: string
  availableTabs: { id: string; label: string; icon?: React.ReactNode }[]
  togglePanel: () => void
  openPanel: () => void
  closePanel: () => void
  setPanelHeight: (height: number) => void
  setActiveTab: (tabId: string) => void
  registerTab: (tab: { id: string; label: string; icon?: React.ReactNode }) => void
  unregisterTab: (tabId: string) => void
}

export interface SettingsSlice {
  wakeLockEnabled: boolean
  setWakeLockEnabled: (enabled: boolean) => void
}
