import type { PresetThemeId } from './themes'
import { themes } from './themes'
import { defaultTheme } from './themes/default'
import type { Theme, ThemeColors, ThemeFonts, ThemeMode } from './types'

export * from './lib/fonts'
export * from './lib/googleFont'
export * from './themes'
export * from './types'

// Default theme to use when no theme is saved or selected
export const DEFAULT_THEME: PresetThemeId = 'default'

// `<link id="…">` for Google Fonts injected by `applyTheme`
const THEME_FONT_LINK_ID = 'dashfy-theme-fonts'

/**
 * Get a theme by ID.
 *
 * @param id - The theme identifier (e.g., 'default', 'minimal', 'nord')
 * @returns The theme object
 *
 * @example
 * ```ts
 * import { getTheme } from '@dashfy/themes'
 *
 * const minimalTheme = getTheme('minimal')
 * console.log(minimalTheme.displayName) // "Minimal"
 * ```
 */
export function getTheme(id: PresetThemeId): Theme {
  return themes[id]
}

/**
 * Apply a theme by setting CSS variables on the document root element.
 *
 * This function:
 * - Sets all theme CSS variables on `:root`
 * - Adds a `data-theme` attribute for theme-specific CSS selectors
 * - Applies the appropriate mode (light or dark) based on the current mode setting
 * - Is safe to call in SSR environments (no-op when document is undefined)
 *
 * @param theme - The theme object to apply
 * @param mode - Optional mode to apply ('light' or 'dark'). If not provided, uses current mode from DOM
 *
 * @example
 * ```ts
 * import { applyTheme, defaultTheme } from '@dashfy/themes'
 *
 * // Apply default theme in light mode
 * applyTheme(defaultTheme, 'light')
 *
 * // Apply default theme in dark mode
 * applyTheme(defaultTheme, 'dark')
 *
 * // Apply theme using current mode from DOM
 * applyTheme(defaultTheme)
 * ```
 */
export function applyTheme(theme: Theme, mode?: ThemeMode): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  // Determine which mode to use
  const currentMode = mode ?? (root.classList.contains('dark') ? 'dark' : 'light')
  const themeColors = currentMode === 'dark' ? theme.dark : theme.light

  // Apply all CSS variables to root element
  Object.entries(themeColors.cssVariables).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  if (theme.fonts) {
    // Apply font CSS variables to root element
    Object.entries(theme.fonts.cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })

    let link = document.getElementById(THEME_FONT_LINK_ID) as HTMLLinkElement | null

    if (!link) {
      link = document.createElement('link')
      link.id = THEME_FONT_LINK_ID
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }

    link.href = theme.fonts.importHref
  } else {
    document.getElementById(THEME_FONT_LINK_ID)?.remove()
    root.style.removeProperty('--font-sans')
    root.style.removeProperty('--font-mono')
  }

  // Set data attribute for theme-specific CSS selectors
  root.setAttribute('data-theme', theme.id)
}

/**
 * Remove a theme by clearing its CSS variables from the document root.
 *
 * This function:
 * - Removes all CSS variables defined by the theme
 * - Removes the `data-theme` attribute
 * - Is safe to call in SSR environments (no-op when document is undefined)
 *
 * @param theme - The theme object to remove
 *
 * @example
 * ```ts
 * import { removeTheme, darkTheme } from '@dashfy/themes'
 *
 * // Remove theme styling
 * removeTheme(darkTheme)
 * ```
 *
 * @remarks
 * Typically you would just apply a new theme instead of removing one.
 * This function is useful for cleanup or testing scenarios.
 */
export function removeTheme(theme: Theme): void {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement

  // Remove all theme CSS variables from root element
  // We only need to remove from light since light and dark share the same variable names
  Object.keys(theme.light.cssVariables).forEach((key) => {
    root.style.removeProperty(key)
  })

  if (theme.fonts) {
    // Remove font CSS variables from root element
    Object.keys(theme.fonts.cssVariables).forEach((key) => {
      root.style.removeProperty(key)
    })
  }

  document.getElementById(THEME_FONT_LINK_ID)?.remove()

  // Remove theme data attribute
  root.removeAttribute('data-theme')
}

/**
 * Get the currently applied theme ID from the document.
 *
 * Reads the `data-theme` attribute from the document root element.
 *
 * @returns The current theme ID, or null if no theme is applied or in SSR
 *
 * @example
 * ```ts
 * import { getCurrentTheme, applyTheme, darkTheme } from '@dashfy/themes'
 *
 * applyTheme(darkTheme)
 * const current = getCurrentTheme()
 * console.log(current) // "dark"
 * ```
 */
export function getCurrentTheme(): PresetThemeId | null {
  if (typeof document === 'undefined') {
    return null
  }

  const themeId = document.documentElement.getAttribute('data-theme')
  return themeId as PresetThemeId | null
}

/**
 * Get an array of all available theme IDs.
 *
 * @returns Array of theme identifiers
 *
 * @example
 * ```ts
 * import { listThemes } from '@dashfy/themes'
 *
 * const themeIds = listThemes()
 * console.log(themeIds) // ["default", "minimal", "nord"]
 *
 * // Use in a theme selector
 * themeIds.forEach(id => {
 *   console.log(`Available theme: ${id}`)
 * })
 * ```
 */
export function listThemes(): PresetThemeId[] {
  return Object.keys(themes) as PresetThemeId[]
}

export interface CreateThemeOptions {
  /** Unique theme identifier (e.g., 'custom-blue') */
  id: string
  /** Internal theme name (e.g., 'customBlue') */
  name: string
  /** Human-readable name shown in UI (e.g., 'Custom Blue') */
  displayName: string
  /** Partial color overrides for light mode */
  lightColors: Partial<ThemeColors>
  /** Partial color overrides for dark mode (optional, defaults to lightColors) */
  darkColors?: Partial<ThemeColors>
  /** Base theme to extend from (defaults to defaultTheme) */
  baseTheme?: Theme
  /** Override typography / Google Fonts (defaults to base theme) */
  fonts?: ThemeFonts
}

/**
 * Create a custom theme by extending an existing theme.
 *
 * This utility function creates a new theme object by:
 * - Merging your custom colors with a base theme
 * - Automatically generating CSS variables from color names
 * - Converting camelCase color names to kebab-case CSS variables
 * - Supports both light and dark mode colors
 *
 * @param options - Theme configuration options
 * @returns A complete theme object ready to use with `applyTheme()`
 *
 * @example Basic custom theme
 * ```ts
 * import { createTheme, applyTheme } from '@dashfy/themes'
 *
 * const myTheme = createTheme({
 *   id: 'ocean',
 *   name: 'ocean',
 *   displayName: 'Ocean Blue',
 *   lightColors: {
 *     primary: 'hsl(200 80% 50%)',
 *     secondary: 'hsl(180 70% 50%)',
 *   }
 * })
 *
 * applyTheme(myTheme, 'light')
 * ```
 *
 * @example Theme with different light and dark colors
 * ```ts
 * import { createTheme, applyTheme } from '@dashfy/themes'
 *
 * const customTheme = createTheme({
 *   id: 'custom',
 *   name: 'custom',
 *   displayName: 'Custom Theme',
 *   lightColors: { primary: 'hsl(200 80% 50%)' },
 *   darkColors: { primary: 'hsl(200 80% 70%)' }
 * })
 *
 * applyTheme(customTheme, 'dark')
 * ```
 *
 * @example Extending a different base theme
 * ```ts
 * import { createTheme, minimalTheme, applyTheme } from '@dashfy/themes'
 *
 * const customMinimal = createTheme({
 *   id: 'custom-minimal',
 *   name: 'customMinimal',
 *   displayName: 'Custom Minimal',
 *   lightColors: { primary: 'hsl(0 0% 20%)' },
 *   baseTheme: minimalTheme
 * })
 *
 * applyTheme(customMinimal, 'light')
 * ```
 */
export function createTheme(options: CreateThemeOptions): Theme {
  const {
    id,
    name,
    displayName,
    lightColors,
    darkColors,
    baseTheme = defaultTheme,
    fonts,
  } = options

  const convertColorsToCssVars = (colors: Partial<ThemeColors>) => {
    return Object.entries(colors).reduce(
      (acc, [key, value]) => {
        const cssVar = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
        // Convert hsl() format to space-separated values if needed
        const cssValue =
          typeof value === 'string' && value.startsWith('hsl(')
            ? value.replace('hsl(', '').replace(')', '')
            : value
        acc[cssVar] = cssValue
        return acc
      },
      {} as Record<string, string>,
    )
  }

  return {
    id,
    name,
    displayName,
    fonts: fonts ?? baseTheme.fonts,
    light: {
      colors: { ...baseTheme.light.colors, ...lightColors },
      cssVariables: {
        ...baseTheme.light.cssVariables,
        ...convertColorsToCssVars(lightColors),
      },
    },
    dark: {
      colors: { ...baseTheme.dark.colors, ...(darkColors ?? lightColors) },
      cssVariables: {
        ...baseTheme.dark.cssVariables,
        ...convertColorsToCssVars(darkColors ?? lightColors),
      },
    },
  }
}
