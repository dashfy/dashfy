import type { StateCreator } from 'zustand'

import type { ApiSlice, DashfyStore } from '@/store/types'

/**
 * Creates the API slice for managing WebSocket API subscriptions and data.
 *
 * Handles subscription lifecycle (subscribe/unsubscribe), tracks subscription states,
 * manages API response data, errors, and loading states. Subscriptions are identified
 * by unique IDs and can be queried for pending status.
 */
export const createApiSlice: StateCreator<DashfyStore, [], [], ApiSlice> = (set, get) => ({
  apiSubscriptions: new Map(),
  apiData: {},

  /**
   * Add a subscription to the store.
   *
   * @param subscription - The subscription to add
   * @returns The new state with the added subscription
   */
  subscribeApi: (subscription) => {
    set((state) => {
      if (state.apiSubscriptions.has(subscription.id)) {
        return state
      }

      const newSubscriptions = new Map(state.apiSubscriptions)

      newSubscriptions.set(subscription.id, {
        ...subscription,
        hasSubscribed: false,
      })

      return { apiSubscriptions: newSubscriptions }
    })
  },

  /**
   * Unsubscribe from an API.
   *
   * @param id - The ID of the subscription to unsubscribe from
   * @returns The new state with the subscription removed
   */
  unsubscribeApi: (id) => {
    set((state) => {
      const newSubscriptions = new Map(state.apiSubscriptions)
      newSubscriptions.delete(id)
      return { apiSubscriptions: newSubscriptions }
    })
  },

  /**
   * Set a subscription as subscribed.
   *
   * @param id - The ID of the subscription to set as subscribed
   * @returns The new state with the subscription set as subscribed
   */
  setApiSubscribed: (id) => {
    set((state) => {
      const sub = state.apiSubscriptions.get(id)

      if (!sub) {
        return state
      }

      const newSubscriptions = new Map(state.apiSubscriptions)
      newSubscriptions.set(id, { ...sub, hasSubscribed: true })
      return { apiSubscriptions: newSubscriptions }
    })
  },

  /**
   * Set all subscriptions as unsubscribed.
   *
   * @returns The new state with all subscriptions set as unsubscribed
   */
  setAllApiUnsubscribed: () => {
    set((state) => {
      const newSubscriptions = new Map()
      state.apiSubscriptions.forEach((sub, id) => {
        newSubscriptions.set(id, { ...sub, hasSubscribed: false })
      })
      return { apiSubscriptions: newSubscriptions }
    })
  },

  /**
   * Set the data for an API.
   *
   * @param id - The ID of the API
   * @param data - The data to set
   * @returns The new state with the data set
   */
  setApiData: (id, data) => {
    set((state) => ({
      apiData: {
        ...state.apiData,
        [id]: {
          data,
          error: null,
          loading: false,
          lastUpdate: Date.now(),
        },
      },
    }))
  },

  /**
   * Set the error for an API.
   *
   * @param id - The ID of the API
   * @param error - The error to set
   * @returns The new state with the error set
   */
  setApiError: (id, error) => {
    set((state) => ({
      apiData: {
        ...state.apiData,
        [id]: {
          data: state.apiData[id]?.data ?? null,
          error,
          loading: false,
          lastUpdate: Date.now(),
        },
      },
    }))
  },

  /**
   * Set the loading state for an API.
   *
   * @param id - The ID of the API
   * @param loading - The loading state to set
   * @returns The new state with the loading state set
   */
  setApiLoading: (id, loading) => {
    set((state) => ({
      apiData: {
        ...state.apiData,
        [id]: {
          data: state.apiData[id]?.data ?? null,
          error: state.apiData[id]?.error ?? null,
          loading,
          lastUpdate: state.apiData[id]?.lastUpdate ?? Date.now(),
        },
      },
    }))
  },

  /**
   * Get the pending subscriptions.
   *
   * @returns The pending subscriptions
   */
  getApiPendingSubscriptions: () => {
    const state = get()
    return Array.from(state.apiSubscriptions.values()).filter((sub) => !sub.hasSubscribed)
  },

  /**
   * Check if a subscription exists.
   *
   * @param id - The ID of the subscription to check
   * @returns True if the subscription exists, false otherwise
   */
  hasApiSubscription: (id) => {
    return get().apiSubscriptions.has(id)
  },

  /**
   * Clear the data for an API.
   *
   * @param id - The ID of the API to clear
   * @returns The new state with the data cleared
   */
  clearApiData: (id) => {
    set((state) => {
      const newData = { ...state.apiData }
      delete newData[id]
      return { apiData: newData }
    })
  },
})
