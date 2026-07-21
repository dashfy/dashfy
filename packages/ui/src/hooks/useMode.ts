import type { ThemeMode } from '@getdashfy/themes'
import { isClient, isServer } from '@getdashfy/utils'
import * as React from 'react'

import { MODE_STORAGE_KEY } from '@/constants/storageConstants'
import { StorageSync } from '@/lib/StorageSync'

// Initialize mode immediately (before any component renders)
function getInitialMode(): ThemeMode {
  if (isServer) {
    return 'light'
  }

  const savedMode = StorageSync.get<ThemeMode>(MODE_STORAGE_KEY)

  if (savedMode) {
    return savedMode
  }

  try {
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return systemPrefersDark ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

// Apply initial mode to DOM immediately
if (isClient) {
  try {
    const initialMode = getInitialMode()

    if (initialMode === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  } catch {
    // May fail in some test environments
  }
}

/**
 * Hook to manage light/dark mode state and transitions.
 * Syncs with localStorage and observes DOM changes.
 *
 * Note: This hook only manages the mode (light/dark).
 * Theme application is handled by ThemeProvider.
 *
 * @returns Object containing:
 * - `mode` - The current mode (light/dark)
 * - `toggleMode` - Function to toggle the mode
 * - `isLight` - Whether the mode is light
 * - `isDark` - Whether the mode is dark
 *
 * @example
 * ```tsx
 * const { mode, toggleMode, isLight, isDark } = useMode()
 *
 * return (
 *   <div>
 *     <button onClick={toggleMode}>{isLight ? 'Dark' : 'Light'}</button>
 *   </div>
 * )
 * ```
 */
export function useMode() {
  const [mode, setMode] = React.useState<ThemeMode>(getInitialMode)

  const applyMode = React.useCallback((newMode: ThemeMode) => {
    const root = document.documentElement

    // Toggle dark class (ThemeProvider will handle applying the theme)
    if (newMode === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [])

  React.useEffect(() => {
    // Listen for dark class changes on document.documentElement
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark')
      const newMode = isDark ? 'dark' : 'light'
      setMode(newMode)
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => observer.disconnect()
  }, [])

  React.useEffect(() => {
    // Listen for storage changes from other tabs/windows
    const unsubscribe = StorageSync.onChange((event) => {
      if (event.key?.endsWith(MODE_STORAGE_KEY) && event.newValue) {
        try {
          const payload = JSON.parse(event.newValue) as { value: string; expiry: number | null }
          const newMode = JSON.parse(payload.value) as ThemeMode
          setMode(newMode)
          applyMode(newMode)
        } catch {
          // Ignore invalid values
        }
      }
    })

    return unsubscribe
  }, [applyMode])

  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light'
    setMode(newMode)
    applyMode(newMode)
    StorageSync.set(MODE_STORAGE_KEY, newMode)
  }

  return {
    mode,
    toggleMode,
    isLight: mode === 'light',
    isDark: mode === 'dark',
  }
}
