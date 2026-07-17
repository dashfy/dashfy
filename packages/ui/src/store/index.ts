import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import { createApiSlice } from './slices/apiSlice'
import { createConfigurationSlice } from './slices/configurationSlice'
import { createDashboardsSlice } from './slices/dashboardsSlice'
import { createNotificationsSlice } from './slices/notificationsSlice'
import { createPanelSlice } from './slices/panelSlice'
import { createSettingsSlice, subscribeToSettingsChanges } from './slices/settingsSlice'
import { createThemesSlice, subscribeToThemeChanges } from './slices/themesSlice'
import { createWsSlice } from './slices/wsSlice'
import type { DashfyStore } from './types'

const STORE_NAME = 'DashfyStore'

/**
 * Main Dashfy store combining all slices.
 * Uses Zustand with devtools middleware for debugging.
 */
export const useDashfyStore = create<DashfyStore>()(
  devtools(
    (set, get, api) => ({
      ...createConfigurationSlice(set, get, api),
      ...createDashboardsSlice(set, get, api),
      ...createApiSlice(set, get, api),
      ...createWsSlice(set, get, api),
      ...createThemesSlice(set, get, api),
      ...createNotificationsSlice(set, get, api),
      ...createPanelSlice(set, get, api),
      ...createSettingsSlice(set, get, api),
    }),
    { name: STORE_NAME },
  ),
)

// Subscribe to storage changes from other tabs/windows
subscribeToThemeChanges(useDashfyStore.getState())
subscribeToSettingsChanges(useDashfyStore.getState())
