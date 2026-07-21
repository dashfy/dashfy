import { isServer } from '@getdashfy/utils'
import type { StateCreator } from 'zustand'

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

export const MIN_PANEL_HEIGHT = 150
export const MAX_PANEL_HEIGHT = 600

const FALLBACK_PANEL_HEIGHT = 350

/**
 * Returns the panel height appropriate for the current viewport.
 * Portrait: 350px. Landscape: 30% of screen height (clamped to MIN/MAX).
 * Safe to call on the client; returns FALLBACK_PANEL_HEIGHT during SSR.
 */
export function getPanelHeightForViewport(): number {
  if (isServer) {
    return FALLBACK_PANEL_HEIGHT
  }

  const isLandscape = window.innerWidth > window.innerHeight

  if (!isLandscape) {
    return FALLBACK_PANEL_HEIGHT
  }

  const height = Math.round(window.innerHeight * 0.3)
  return Math.min(Math.max(height, MIN_PANEL_HEIGHT), MAX_PANEL_HEIGHT)
}

export const DEFAULT_PANEL_HEIGHT = getPanelHeightForViewport()

/**
 * Creates the panel slice for managing panel state.
 *
 * Provides methods to set, manage, and navigate through panel state.
 * Manages panel visibility, height, active tab, and available tabs.
 */
export const createPanelSlice: StateCreator<PanelSlice> = (set) => ({
  isPanelOpen: false,
  panelHeight: DEFAULT_PANEL_HEIGHT,
  activeTab: 'connection',
  availableTabs: [
    { id: 'connection', label: 'Connection' },
    // More tabs can be added dynamically
  ],

  togglePanel: () => {
    set((state) => ({
      isPanelOpen: !state.isPanelOpen,
    }))
  },

  openPanel: () => {
    set({
      isPanelOpen: true,
    })
  },

  closePanel: () => {
    set({
      isPanelOpen: false,
    })
  },

  setPanelHeight: (height: number) => {
    const clampedHeight = Math.min(Math.max(height, MIN_PANEL_HEIGHT), MAX_PANEL_HEIGHT)
    set({ panelHeight: clampedHeight })
  },

  setActiveTab: (tabId: string) => {
    set({ activeTab: tabId })
  },

  registerTab: (tab) => {
    set((state) => {
      // Don't add duplicates
      if (state.availableTabs.some((availableTab) => availableTab.id === tab.id)) {
        return state
      }

      return {
        availableTabs: [...state.availableTabs, tab],
      }
    })
  },

  unregisterTab: (tabId: string) => {
    set((state) => ({
      availableTabs: state.availableTabs.filter((tab) => tab.id !== tabId),
      // Switch to first tab if active tab is removed
      activeTab: state.activeTab === tabId ? (state.availableTabs[0]?.id ?? '') : state.activeTab,
    }))
  },
})
