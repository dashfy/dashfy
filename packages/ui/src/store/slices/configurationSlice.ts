import { getErrorMessage } from '@dashfy/utils'
import type { DashfyConfig } from '@getdashfy/types'
import type { StateCreator } from 'zustand'

import type { ConfigurationSlice, DashfyStore } from '@/store/types'

/**
 * Creates the configuration slice for managing Dashfy application configuration.
 *
 * Provides methods to set, fetch, and manage configuration state including loading
 * and error states. Configuration can be set directly or fetched from the server
 * via the /config endpoint.
 */
export const createConfigurationSlice: StateCreator<DashfyStore, [], [], ConfigurationSlice> = (
  set,
) => ({
  config: null,
  isLoading: false,
  error: null,

  setConfig: (config) => set({ config, error: null }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  fetchConfig: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/config')

      if (!response.ok) {
        throw new Error(`Failed to fetch configuration: ${response.statusText}`)
      }

      const config = (await response.json()) as DashfyConfig
      set({ config, isLoading: false })
    } catch (error) {
      set({ error: getErrorMessage(error), isLoading: false })
    }
  },
})
