import { isClient, isServer } from '@dashfy/utils'
import type { ThemeId } from '@getdashfy/types'
import type { StateCreator } from 'zustand'

import { THEME_STORAGE_KEY } from '@/constants/storageConstants'
import { StorageSync } from '@/lib/StorageSync'
import type { DashfyStore, ThemesSlice } from '@/store/types'

/**
 * Load theme from localStorage on initialization.
 * Returns null if no theme was saved - ThemeProvider will set the default.
 */
const getInitialTheme = (): ThemeId | null => {
  if (isServer) {
    return null
  }

  return StorageSync.get<ThemeId>(THEME_STORAGE_KEY)
}

/**
 * Creates the themes slice for managing themes.
 *
 * Provides methods to set, manage, and navigate through themes.
 * Manages current theme, available themes, and provides helper functions to
 * set the current theme and available themes.
 *
 * Note: availableThemes starts empty and is populated by ThemeProvider
 * after themes are registered via ThemeRegistry.
 */
export const createThemesSlice: StateCreator<DashfyStore, [], [], ThemesSlice> = (set) => ({
  currentTheme: getInitialTheme(),
  availableThemes: [], // Will be populated by ThemeProvider after themes are registered

  setTheme: (currentTheme) => {
    set({ currentTheme })

    if (isClient) {
      StorageSync.set(THEME_STORAGE_KEY, currentTheme)
    }
  },

  setAvailableThemes: (availableThemes) => set({ availableThemes }),
})

/**
 * Subscribe to theme changes from other tabs/windows.
 * Call this once when the store is initialized.
 *
 * @param store - The Zustand store instance
 * @returns Cleanup function to unsubscribe
 */
export const subscribeToThemeChanges = (store: DashfyStore): (() => void) => {
  if (!isClient) {
    return () => {
      // No-op for server-side
    }
  }

  return StorageSync.onChange((event) => {
    if (event.key?.endsWith(THEME_STORAGE_KEY) && event.newValue) {
      try {
        const payload = JSON.parse(event.newValue) as { value: string; expiry: number | null }
        const newTheme = JSON.parse(payload.value) as ThemeId
        store.setTheme(newTheme)
      } catch {
        // Ignore invalid values
      }
    }
  })
}
