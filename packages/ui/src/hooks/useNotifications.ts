import { useDashfyStore } from '@/store'

/**
 * Hook for managing toast notifications and alerts.
 *
 * Provides access to the notification list and methods for adding, removing, and
 * clearing notifications. Includes convenience methods for common notification types
 * (success, error, warning, info) with appropriate styling and defaults.
 *
 * @returns Object containing:
 * - `notifications` - Array of active notifications
 * - `addNotification` - Function to add a custom notification with full control
 * - `removeNotification` - Function to remove a notification by ID
 * - `clearNotifications` - Function to clear all notifications
 * - `notifySuccess` - Convenience function to show a success notification
 * - `notifyError` - Convenience function to show an error notification
 * - `notifyWarning` - Convenience function to show a warning notification
 * - `notifyInfo` - Convenience function to show an info notification
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { notifySuccess, notifyError, notifyWarning } = useNotifications()
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData()
 *       notifySuccess('Data saved successfully!')
 *     } catch (error) {
 *       notifyError('Failed to save data')
 *     }
 *   }
 *
 *   return <button onClick={handleSave}>Save</button>
 * }
 * ```
 */
export function useNotifications() {
  const notifications = useDashfyStore((state) => state.notifications)
  const addNotification = useDashfyStore((state) => state.addNotification)
  const removeNotification = useDashfyStore((state) => state.removeNotification)
  const clearNotifications = useDashfyStore((state) => state.clearNotifications)
  const notifySuccess = useDashfyStore((state) => state.notifySuccess)
  const notifyError = useDashfyStore((state) => state.notifyError)
  const notifyWarning = useDashfyStore((state) => state.notifyWarning)
  const notifyInfo = useDashfyStore((state) => state.notifyInfo)

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
  }
}
