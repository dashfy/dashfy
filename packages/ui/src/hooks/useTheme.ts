import type { ThemeId } from '@dashfy/types'

import { ThemeRegistry } from '@/registry/ThemeRegistry'
import { useDashfyStore } from '@/store'

/**
 * Note: This hook only provides theme state and setters.
 * Theme application is handled by ThemeProvider.
 *
 * @returns Object containing:
 * - `currentTheme` - The current theme ID
 * - `availableThemes` - Array of available theme IDs
 * - `setTheme` - Function to set the theme
 * - `getTheme` - Function to get a theme by ID from ThemeRegistry
 *
 * @example
 * ```tsx
 * const { currentTheme, availableThemes, setTheme, getTheme } = useTheme()
 *
 * return (
 *   <div>
 *     <button onClick={() => setTheme('default')}>Default</button>
 *     <button onClick={() => setTheme('nord')}>Nord</button>
 *   </div>
 * )
 * ```
 */
export function useTheme() {
  const currentTheme = useDashfyStore((state) => state.currentTheme)
  const availableThemes = useDashfyStore((state) => state.availableThemes)
  const setTheme = useDashfyStore((state) => state.setTheme)

  return {
    currentTheme,
    availableThemes,
    setTheme,
    getTheme: (id: ThemeId) => ThemeRegistry.get(id),
  }
}
