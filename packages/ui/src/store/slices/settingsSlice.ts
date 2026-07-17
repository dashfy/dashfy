import { isClient, isServer } from '@dashfy/utils'
import type { StateCreator } from 'zustand'

import { WAKE_LOCK_STORAGE_KEY } from '@/constants/storageConstants'
import { StorageSync } from '@/lib/StorageSync'
import type { DashfyStore, SettingsSlice } from '@/store/types'

// Load wake lock preference from localStorage on initialization
const getInitialWakeLockEnabled = (): boolean => {
  if (isServer) {
    return false
  }

  const stored = StorageSync.get<boolean>(WAKE_LOCK_STORAGE_KEY)
  return stored ?? false
}

/**
 * Creates the settings slice for managing user preferences.
 *
 * Provides methods to manage user settings like wake lock preference.
 * Settings are persisted to localStorage.
 */
export const createSettingsSlice: StateCreator<DashfyStore, [], [], SettingsSlice> = (set) => ({
  wakeLockEnabled: getInitialWakeLockEnabled(),

  setWakeLockEnabled: (enabled) => {
    set({ wakeLockEnabled: enabled })

    if (isClient) {
      StorageSync.set(WAKE_LOCK_STORAGE_KEY, enabled)
    }
  },
})

/**
 * Subscribe to settings changes from other tabs/windows.
 * Call this once when the store is initialized.
 *
 * @param store - The Zustand store instance
 * @returns Cleanup function to unsubscribe
 */
export const subscribeToSettingsChanges = (store: DashfyStore): (() => void) => {
  if (!isClient) {
    return () => {
      // No-op for server-side
    }
  }

  return StorageSync.onChange((event) => {
    if (event.key?.endsWith(WAKE_LOCK_STORAGE_KEY) && event.newValue) {
      try {
        const payload = JSON.parse(event.newValue) as { value: string; expiry: number | null }
        const enabled = JSON.parse(payload.value) as boolean
        store.setWakeLockEnabled(enabled)
      } catch {
        // Ignore invalid values
      }
    }
  })
}
