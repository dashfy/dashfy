import { NotificationType } from '@dashfy/types'
import type { StateCreator } from 'zustand'

import type { DashfyStore, NotificationsSlice } from '@/store/types'

// Auto-incrementing ID for notifications
let notificationId = 0

/**
 * Creates the notifications slice for managing notifications.
 *
 * Provides methods to add, remove, and clear notifications.
 * Manages notification state and provides helper functions to show
 * success, error, warning, and info notifications.
 */
export const createNotificationsSlice: StateCreator<DashfyStore, [], [], NotificationsSlice> = (
  set,
) => ({
  notifications: [],

  /**
   * Add a custom notification to the store.
   *
   * @param notification - Notification object (without id and createdAt)
   * @returns The notification ID for manual removal if needed
   */
  addNotification: (notification) => {
    const id = `notification-${++notificationId}`
    const newNotification = {
      ...notification,
      id,
      createdAt: Date.now(),
    }

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }))

    // Auto-remove notification after TTL (Time To Live)
    // If ttl > 0, schedule automatic removal after the specified time
    // If ttl is -1 or 0, notification stays until manually dismissed
    if (notification.ttl && notification.ttl > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id),
        }))
      }, notification.ttl)
    }

    return id
  },

  /**
   * Remove a specific notification by ID.
   *
   * @param id - The notification ID to remove
   */
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== id),
    }))
  },

  /**
   * Clear all notifications from the store.
   */
  clearNotifications: () => set({ notifications: [] }),

  /**
   * Show a success notification.
   *
   * @param message - The message to display
   * @param ttl - Time To Live in milliseconds (default: 2000ms = 2s)
   *              Use -1 or 0 to prevent auto-dismiss
   * @returns The notification ID for manual removal if needed
   */
  notifySuccess: (message, ttl = 2_000) => {
    const id = `notification-${++notificationId}`
    const notification = {
      id,
      type: NotificationType.SUCCESS,
      message,
      ttl,
      createdAt: Date.now(),
    }

    set((state) => ({
      notifications: [...state.notifications, notification],
    }))

    if (ttl > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id),
        }))
      }, ttl)
    }

    return id
  },

  /**
   * Show an error notification.
   *
   * @param message - The message to display
   * @param ttl - Time To Live in milliseconds (default: -1 = never auto-dismiss)
   *              User must manually close error notifications
   * @returns The notification ID for manual removal if needed
   */
  notifyError: (message, ttl = -1) => {
    const id = `notification-${++notificationId}`
    const notification = {
      id,
      type: NotificationType.ERROR,
      message,
      ttl,
      createdAt: Date.now(),
    }

    set((state) => ({
      notifications: [...state.notifications, notification],
    }))

    if (ttl > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id),
        }))
      }, ttl)
    }

    return id
  },

  /**
   * Show a warning notification.
   *
   * @param message - The message to display
   * @param ttl - Time To Live in milliseconds (default: 6000ms = 6s)
   *              Longer duration for important warnings
   * @returns The notification ID for manual removal if needed
   */
  notifyWarning: (message, ttl = 6_000) => {
    const id = `notification-${++notificationId}`
    const notification = {
      id,
      type: NotificationType.WARNING,
      message,
      ttl,
      createdAt: Date.now(),
    }

    set((state) => ({
      notifications: [...state.notifications, notification],
    }))

    if (ttl > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id),
        }))
      }, ttl)
    }

    return id
  },

  /**
   * Show an info notification.
   *
   * @param message - The message to display
   * @param ttl - Time To Live in milliseconds (default: 4000ms = 4s)
   * @returns The notification ID for manual removal if needed
   */
  notifyInfo: (message, ttl = 4_000) => {
    const id = `notification-${++notificationId}`
    const notification = {
      id,
      type: NotificationType.INFO,
      message,
      ttl,
      createdAt: Date.now(),
    }

    set((state) => ({
      notifications: [...state.notifications, notification],
    }))

    if (ttl > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((notification) => notification.id !== id),
        }))
      }, ttl)
    }

    return id
  },
})
