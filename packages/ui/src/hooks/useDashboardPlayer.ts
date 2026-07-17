import * as React from 'react'

import { DEFAULT_AUTO_PLAY, DEFAULT_ROTATION_DURATION } from '@/constants/dashboardConstants'

import { useDashboards } from './useDashboards'

export interface UseDashboardPlayerOptions {
  rotationDuration?: number
  autoPlay?: boolean
}

/**
 * Hook for managing automatic dashboard rotation and playback controls.
 *
 * Handles automatic cycling through dashboards at specified intervals when playing.
 * Supports auto-play on mount and manual play/pause controls. Only rotates when
 * multiple dashboards are available.
 *
 * @param options - Player configuration options
 * @param options.rotationDuration - Time in milliseconds between dashboard switches (default: 10000ms)
 * @param options.autoPlay - Whether to start playing automatically on mount (default: false)
 *
 * @returns Object containing:
 * - `isPlaying` - Whether the dashboard player is playing
 * - `play` - Function to start playing the dashboard player
 * - `pause` - Function to pause the dashboard player
 *
 * @example
 * ```tsx
 * function DashboardCarousel() {
 *   const { isPlaying, play, pause } = useDashboardPlayer({
 *     rotationDuration: 5000,
 *     autoPlay: true
 *   })
 *
 *   return (
 *     <button onClick={isPlaying ? pause : play}>
 *       {isPlaying ? 'Pause' : 'Play'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useDashboardPlayer({
  rotationDuration = DEFAULT_ROTATION_DURATION,
  autoPlay = DEFAULT_AUTO_PLAY,
}: UseDashboardPlayerOptions = {}) {
  const { isPlaying, nextDashboard, play, pause, dashboards } = useDashboards()
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null)

  // Auto-play on mount if enabled
  React.useEffect(() => {
    if (autoPlay && dashboards.length > 1) {
      play()
    }
  }, [autoPlay, dashboards.length, play])

  // Manage rotation interval
  React.useEffect(() => {
    if (isPlaying && dashboards.length > 1) {
      intervalRef.current = setInterval(() => {
        nextDashboard()
      }, rotationDuration)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, rotationDuration, nextDashboard, dashboards.length])

  return {
    isPlaying,
    play,
    pause,
  }
}
