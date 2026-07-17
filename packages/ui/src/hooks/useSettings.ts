import { useDashfyStore } from '@/store'

/**
 * Hook to access and manage user settings.
 *
 * @returns Object containing:
 * - `wakeLockEnabled` - Whether the wake lock is enabled
 * - `setWakeLockEnabled` - Function to set the wake lock enabled
 *
 * @example
 * ```tsx
 * const { wakeLockEnabled, setWakeLockEnabled } = useSettings()
 * ```
 */
export const useSettings = () => {
  const wakeLockEnabled = useDashfyStore((state) => state.wakeLockEnabled)
  const setWakeLockEnabled = useDashfyStore((state) => state.setWakeLockEnabled)

  return {
    wakeLockEnabled,
    setWakeLockEnabled,
  }
}
