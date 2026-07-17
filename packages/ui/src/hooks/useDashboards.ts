import { useDashfyStore } from '@/store'

/**
 * Hook for accessing and controlling dashboard state and navigation.
 *
 * Provides access to the dashboard list, current dashboard, and navigation controls
 * including next/previous navigation and play/pause functionality for automatic rotation.
 *
 * @returns Object containing:
 * - `dashboards` - Array of all available dashboards
 * - `currentDashboard` - Index of the currently active dashboard
 * - `current` - The current dashboard object (or null if none)
 * - `isPlaying` - Whether auto-rotation is active
 * - `setCurrentDashboard` - Function to set dashboard by index
 * - `nextDashboard` - Function to navigate to next dashboard
 * - `previousDashboard` - Function to navigate to previous dashboard
 * - `play` - Function to start auto-rotation
 * - `pause` - Function to stop auto-rotation
 * - `togglePlay` - Function to toggle play/pause state
 *
 * @example
 * ```tsx
 * function DashboardControls() {
 *   const {
 *     current,
 *     currentDashboard,
 *     dashboards,
 *     nextDashboard,
 *     previousDashboard,
 *     isPlaying,
 *     togglePlay
 *   } = useDashboards()
 *
 *   return (
 *     <div>
 *       <h2>{current?.title || 'No Dashboard'}</h2>
 *       <p>Dashboard {currentDashboard + 1} of {dashboards.length}</p>
 *       <button onClick={previousDashboard}>Previous</button>
 *       <button onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
 *       <button onClick={nextDashboard}>Next</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useDashboards() {
  const dashboards = useDashfyStore((state) => state.dashboards)
  const currentDashboard = useDashfyStore((state) => state.currentDashboard)
  const isPlaying = useDashfyStore((state) => state.isPlaying)
  const setCurrentDashboard = useDashfyStore((state) => state.setCurrentDashboard)
  const nextDashboard = useDashfyStore((state) => state.nextDashboard)
  const previousDashboard = useDashfyStore((state) => state.previousDashboard)
  const play = useDashfyStore((state) => state.play)
  const pause = useDashfyStore((state) => state.pause)
  const togglePlay = useDashfyStore((state) => state.togglePlay)

  const current = dashboards[currentDashboard] ?? null

  return {
    dashboards,
    currentDashboard,
    current,
    isPlaying,
    setCurrentDashboard,
    nextDashboard,
    previousDashboard,
    play,
    pause,
    togglePlay,
  }
}
