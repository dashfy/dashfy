import type { StateCreator } from 'zustand'

import type { DashboardsSlice, DashfyStore } from '@/store/types'

/**
 * Creates the dashboards slice for managing dashboard state.
 *
 * Provides methods to set, manage, and navigate through dashboard collections.
 * Manages current dashboard index, playing state, and provides navigation
 * functions to cycle through dashboards.
 */
export const createDashboardsSlice: StateCreator<DashfyStore, [], [], DashboardsSlice> = (set) => ({
  dashboards: [],
  currentDashboard: 0,
  isPlaying: false,

  setDashboards: (dashboards) => set({ dashboards, currentDashboard: 0 }),

  setCurrentDashboard: (index) => {
    set((state) => ({
      currentDashboard:
        index >= 0 && index < state.dashboards.length ? index : state.currentDashboard,
    }))
  },

  nextDashboard: () => {
    set((state) => ({
      currentDashboard: (state.currentDashboard + 1) % state.dashboards.length,
    }))
  },

  previousDashboard: () => {
    set((state) => ({
      currentDashboard:
        state.currentDashboard === 0 ? state.dashboards.length - 1 : state.currentDashboard - 1,
    }))
  },

  play: () => set({ isPlaying: true }),

  pause: () => set({ isPlaying: false }),

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
})
