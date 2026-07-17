import { isClient, isDevelopment } from '@dashfy/utils'
import * as React from 'react'

import { useDashfyStore } from '@/store'

/**
 * Development-only debug component that logs Dashfy state to console.
 * Provides real-time insights into configuration, WebSocket status,
 * dashboards, API subscriptions, and more.
 *
 * Usage: Add <DebugInfo /> to your component tree during development.
 */
export const DebugInfo = () => {
  const config = useDashfyStore((state) => state.config)
  const status = useDashfyStore((state) => state.status)
  const socket = useDashfyStore((state) => state.socket)
  const dashboards = useDashfyStore((state) => state.dashboards)
  const currentDashboard = useDashfyStore((state) => state.currentDashboard)
  const apiSubscriptions = useDashfyStore((state) => state.apiSubscriptions)
  const apiData = useDashfyStore((state) => state.apiData)
  const notifications = useDashfyStore((state) => state.notifications)
  const currentTheme = useDashfyStore((state) => state.currentTheme)
  const isPanelOpen = useDashfyStore((state) => state.isPanelOpen)
  const isPlaying = useDashfyStore((state) => state.isPlaying)

  React.useEffect(() => {
    // Only log in development
    if (!isDevelopment) {
      return
    }

    console.group('🔍 Dashfy Debug Info')

    // Configuration
    console.group('⚙️  Configuration')
    console.log('Config:', config)
    console.log('Theme:', currentTheme)
    console.log('Rotation Duration:', config?.rotationDuration)
    console.groupEnd()

    // WebSocket
    console.group('🌐 WebSocket')
    console.log('Status:', status)
    console.log('Connected:', socket?.connected ?? false)
    console.log('Socket ID:', socket?.id)
    console.groupEnd()

    // Dashboards
    console.group('📊 Dashboards')
    console.log('Total:', dashboards.length)
    console.log('Current Index:', currentDashboard)
    console.log('Current Dashboard:', dashboards[currentDashboard])
    console.log('Is Playing:', isPlaying)
    console.log('All Dashboards:', dashboards)
    console.groupEnd()

    // API Subscriptions
    console.group('🔌 API Subscriptions')
    console.log('Active Subscriptions:', apiSubscriptions.size)
    console.log('Subscriptions:', Array.from(apiSubscriptions.entries()))
    console.log('API Data Cache:', apiData)
    console.groupEnd()

    // UI State
    console.group('🎨 UI State')
    console.log('Panel Open:', isPanelOpen)
    console.log('Notifications:', notifications.length)
    console.log('Active Notifications:', notifications)
    console.groupEnd()

    console.groupEnd()
  }, [
    apiData,
    apiSubscriptions,
    config,
    currentDashboard,
    currentTheme,
    dashboards,
    isPanelOpen,
    isPlaying,
    notifications,
    socket,
    status,
  ])

  // Make Dashfy store available globally for console debugging
  React.useEffect(() => {
    if (isDevelopment && isClient) {
      // @ts-expect-error - Add to window for debugging
      window.__DASHFY__ = useDashfyStore.getState()
      console.log('💡 Tip: Access Dashfy store in console via window.__DASHFY__')
    }
  }, [])

  return null
}
