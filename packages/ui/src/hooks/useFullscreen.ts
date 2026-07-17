import * as React from 'react'

export interface UseFullscreenOptions {
  /**
   * Target element ID for fullscreen. If not provided, uses document.documentElement
   */
  targetId?: string
}

export interface UseFullscreenReturn {
  isFullscreen: boolean
  toggleFullscreen: () => void
  enterFullscreen: () => void
  exitFullscreen: () => void
}

/**
 * Hook to manage fullscreen state.
 *
 * @param options - Options for the fullscreen hook
 * @param options.targetId - The ID of the element to fullscreen
 *
 * @returns Object containing:
 * - `isFullscreen` - Whether the document is in fullscreen mode
 * - `toggleFullscreen` - Function to toggle fullscreen mode
 * - `enterFullscreen` - Function to enter fullscreen mode
 * - `exitFullscreen` - Function to exit fullscreen mode
 *
 * @example
 * ```tsx
 * const { isFullscreen, toggleFullscreen } = useFullscreen()
 *
 * // Fullscreen a specific element
 * const { toggleFullscreen } = useFullscreen({ targetId: 'dashboard-container' })
 * ```
 */
export const useFullscreen = ({ targetId }: UseFullscreenOptions = {}): UseFullscreenReturn => {
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  const enterFullscreen = React.useCallback(() => {
    const target = targetId ? document.getElementById(targetId) : document.documentElement
    target?.requestFullscreen()
  }, [targetId])

  const exitFullscreen = React.useCallback(() => {
    document.exitFullscreen()
  }, [])

  const toggleFullscreen = React.useCallback(() => {
    if (!document.fullscreenElement) {
      enterFullscreen()
    } else {
      exitFullscreen()
    }
  }, [enterFullscreen, exitFullscreen])

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  return {
    isFullscreen,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
  }
}
