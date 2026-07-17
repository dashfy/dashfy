import { WebSocketStatus } from '@dashfy/types'
import type { StateCreator } from 'zustand'

import type { DashfyStore, WsSlice } from '@/store/types'

/**
 * Creates the WebSocket slice for managing WebSocket state.
 *
 * Provides methods to set, manage, and navigate through WebSocket state.
 * Manages WebSocket connection state, reconnect attempts, and provides helper functions to
 * set the WebSocket connection state and reconnect attempts.
 */
export const createWsSlice: StateCreator<DashfyStore, [], [], WsSlice> = (set) => ({
  socket: null,
  status: WebSocketStatus.DISCONNECTED,
  reconnectAttempt: 0,

  /**
   * Set the WebSocket connection.
   *
   * @param socket - The WebSocket connection to set
   * @returns The new state with the WebSocket connection set
   */
  setSocket: (socket) => set({ socket }),

  /**
   * Set the WebSocket connection status.
   *
   * @param status - The WebSocket connection status to set
   * @returns The new state with the WebSocket connection status set
   */
  setStatus: (status) => set({ status }),

  /**
   * Set the WebSocket reconnect attempts.
   *
   * @param reconnectAttempt - The WebSocket reconnect attempts to set
   * @returns The new state with the WebSocket reconnect attempts set
   */
  setReconnectAttempt: (reconnectAttempt) => set({ reconnectAttempt }),

  /**
   * Increment the WebSocket reconnect attempts.
   *
   * @returns The new state with the WebSocket reconnect attempts incremented
   */
  incrementReconnectAttempt: () =>
    set((state) => ({ reconnectAttempt: state.reconnectAttempt + 1 })),

  /**
   * Reset the WebSocket reconnect attempts.
   *
   * @returns The new state with the WebSocket reconnect attempts reset
   */
  resetReconnectAttempt: () => set({ reconnectAttempt: 0 }),
})
