import { applyTheme, defaultTheme as builtInDefaultTheme } from '@dashfy/themes'
import type { ThemeId } from '@getdashfy/types'
import * as React from 'react'

import { useMode } from '@/hooks/useMode'
import { ThemeRegistry } from '@/registry/ThemeRegistry'
import { useDashfyStore } from '@/store'

export interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: ThemeId
}

export const ThemeProvider = ({ children, defaultTheme }: ThemeProviderProps) => {
  const currentTheme = useDashfyStore((state) => state.currentTheme)
  const setTheme = useDashfyStore((state) => state.setTheme)
  const setAvailableThemes = useDashfyStore((state) => state.setAvailableThemes)
  const { mode } = useMode()

  React.useEffect(() => {
    // If no themes registered, auto-register the built-in default theme
    if (ThemeRegistry.size === 0) {
      ThemeRegistry.add(builtInDefaultTheme)
    }

    // Get available themes from ThemeRegistry
    const themeIds = ThemeRegistry.list()
    setAvailableThemes(themeIds)

    // Get the resolved default theme (from prop, ThemeRegistry, or built-in)
    const resolvedDefaultTheme = defaultTheme ?? ThemeRegistry.defaultTheme

    // If no theme saved (null) or theme is not valid, set to default
    if (currentTheme === null || !ThemeRegistry.has(currentTheme)) {
      setTheme(resolvedDefaultTheme)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    // Skip if no theme set yet
    if (!currentTheme) {
      return
    }

    const theme = ThemeRegistry.get(currentTheme)

    if (theme) {
      applyTheme(theme, mode)
    }
  }, [currentTheme, mode])

  return <>{children}</>
}
