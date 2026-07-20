import { WebSocketStatus } from '@getdashfy/types'

import type { DashfyStore } from './types'

/**
 * Selector to get current dashboard.
 */
export const selectCurrentDashboard = (state: DashfyStore) => {
  return state.dashboards[state.currentDashboard] ?? null
}

/**
 * Selector to check if WebSocket is connected.
 */
export const selectIsConnected = (state: DashfyStore) => {
  return state.status === WebSocketStatus.CONNECTED
}

/**
 * Selector to get widget data by subscription ID.
 */
export const selectWidgetData = (subscriptionId: string) => (state: DashfyStore) => {
  return state.apiData[subscriptionId] ?? null
}

/**
 * Selector to get all active subscriptions.
 */
export const selectActiveSubscriptions = (state: DashfyStore) => {
  return Array.from(state.apiSubscriptions.values()).filter((sub) => sub.hasSubscribed)
}

/**
 * Selector to check if configuration is loaded.
 */
export const selectIsConfigLoaded = (state: DashfyStore) => {
  return state.config !== null && !state.isLoading
}

/**
 * Selector to get theme settings.
 */
export const selectTheme = (state: DashfyStore) => {
  return {
    current: state.currentTheme,
    available: state.availableThemes,
  }
}
