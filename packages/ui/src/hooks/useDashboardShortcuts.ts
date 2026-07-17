import { useHotkeys } from 'react-hotkeys-hook'

export interface UseDashboardShortcutsOptions {
  /**
   * Callback when play/pause is triggered (Space)
   */
  onTogglePlay?: () => void
  /**
   * Callback when previous dashboard is triggered (ArrowLeft)
   */
  onPrevious?: () => void
  /**
   * Callback when next dashboard is triggered (ArrowRight)
   */
  onNext?: () => void
  /**
   * Callback when fullscreen is triggered (F)
   */
  onFullscreen?: () => void
  /**
   * Callback when settings is triggered (S or Cmd+,)
   */
  onSettings?: () => void
  /**
   * Callback when panel is toggled (Cmd+P)
   */
  onTogglePanel?: () => void
  /**
   * Whether shortcuts are enabled
   * @default true
   */
  enabled?: boolean
}

/**
 * Hook to handle dashboard keyboard shortcuts.
 *
 * Shortcuts:
 * - Space: Toggle play/pause
 * - ArrowLeft: Previous dashboard
 * - ArrowRight: Next dashboard
 * - F: Toggle fullscreen
 * - S or Cmd+, (Mac) / Ctrl+, (Windows): Open settings
 * - Cmd+P (Mac) / Ctrl+P (Windows): Toggle panel
 *
 * @example
 * ```tsx
 * useDashboardShortcuts({
 *   onTogglePlay: () => togglePlay(),
 *   onPrevious: () => previousDashboard(),
 *   onNext: () => nextDashboard(),
 *   onFullscreen: () => toggleFullscreen(),
 *   onSettings: () => setOpenSettings(true),
 *   onTogglePanel: () => togglePanel(),
 * })
 * ```
 */
export const useDashboardShortcuts = ({
  onTogglePlay,
  onPrevious,
  onNext,
  onFullscreen,
  onSettings,
  onTogglePanel,
  enabled = true,
}: UseDashboardShortcutsOptions = {}) => {
  // Play/Pause - Space
  useHotkeys(
    'space',
    (event) => {
      event.preventDefault()
      onTogglePlay?.()
    },
    { enabled: enabled && !!onTogglePlay },
  )

  // Previous dashboard - ArrowLeft
  useHotkeys(
    'left',
    (event) => {
      event.preventDefault()
      onPrevious?.()
    },
    { enabled: enabled && !!onPrevious },
  )

  // Next dashboard - ArrowRight
  useHotkeys(
    'right',
    (event) => {
      event.preventDefault()
      onNext?.()
    },
    { enabled: enabled && !!onNext },
  )

  // Fullscreen - F
  useHotkeys(
    'f',
    (event) => {
      event.preventDefault()
      onFullscreen?.()
    },
    { enabled: enabled && !!onFullscreen },
  )

  // Settings - S or Cmd+, (Mac) / Ctrl+, (Windows)
  useHotkeys(
    's, mod+comma',
    (event) => {
      event.preventDefault()
      onSettings?.()
    },
    { enabled: enabled && !!onSettings },
  )

  // Panel - Cmd+P (Mac) / Ctrl+P (Windows)
  useHotkeys(
    'mod+p',
    (event) => {
      event.preventDefault()
      onTogglePanel?.()
    },
    { enabled: enabled && !!onTogglePanel },
  )
}
