import { beforeEach, describe, expect, it } from 'vitest'

import {
  applyTheme,
  createTheme,
  DEFAULT_FONT_MONO,
  DEFAULT_THEME,
  defaultTheme,
  getCurrentTheme,
  getTheme,
  listThemes,
  midnightBlueTheme,
  minimalTheme,
  nordTheme,
  removeTheme,
} from './index'

describe('Theme System', () => {
  beforeEach(() => {
    // Ensure clean DOM state
    document.documentElement.removeAttribute('style')
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.className = ''
    document.getElementById('dashfy-theme-fonts')?.remove()
  })

  describe('DEFAULT_THEME', () => {
    it('should export default theme constant', () => {
      expect(DEFAULT_THEME).toBe('default')
    })
  })

  describe('getTheme', () => {
    it('should return default theme', () => {
      const theme = getTheme('default')
      expect(theme).toBeDefined()
      expect(theme.id).toBe('default')
      expect(theme.name).toBe('default')
      expect(theme.displayName).toBe('Default')
    })

    it('should return minimal theme', () => {
      const theme = getTheme('minimal')
      expect(theme).toBeDefined()
      expect(theme.id).toBe('minimal')
      expect(theme.name).toBe('minimal')
      expect(theme.displayName).toBe('Minimal')
    })

    it('should return nord theme', () => {
      const theme = getTheme('nord')
      expect(theme).toBeDefined()
      expect(theme.id).toBe('nord')
      expect(theme.name).toBe('nord')
      expect(theme.displayName).toBe('Nord')
    })

    it('should return midnight blue theme', () => {
      const theme = getTheme('midnightBlue')
      expect(theme).toBeDefined()
      expect(theme.id).toBe('midnightBlue')
      expect(theme.name).toBe('midnightBlue')
      expect(theme.displayName).toBe('Midnight Blue')
    })

    it('should return theme with light and dark modes', () => {
      const theme = getTheme('default')
      expect(theme.light).toBeDefined()
      expect(theme.dark).toBeDefined()
      expect(theme.light.colors).toBeDefined()
      expect(theme.light.cssVariables).toBeDefined()
      expect(theme.dark.colors).toBeDefined()
      expect(theme.dark.cssVariables).toBeDefined()
    })
  })

  describe('applyTheme', () => {
    it('should apply theme in light mode', () => {
      applyTheme(defaultTheme, 'light')

      const root = document.documentElement
      expect(root.getAttribute('data-theme')).toBe('default')

      // Check that CSS variables are set
      const primaryVar = root.style.getPropertyValue('--primary')
      expect(primaryVar).toBeTruthy()
    })

    it('should apply theme in dark mode', () => {
      applyTheme(defaultTheme, 'dark')

      const root = document.documentElement
      expect(root.getAttribute('data-theme')).toBe('default')

      // Check that CSS variables are set
      const primaryVar = root.style.getPropertyValue('--primary')
      expect(primaryVar).toBeTruthy()
    })

    it('should detect current mode from DOM when mode not provided', () => {
      // Set dark class
      document.documentElement.classList.add('dark')
      applyTheme(defaultTheme)

      const root = document.documentElement
      expect(root.getAttribute('data-theme')).toBe('default')
    })

    it('should default to light mode when no mode specified and no dark class', () => {
      applyTheme(defaultTheme)

      const root = document.documentElement
      expect(root.getAttribute('data-theme')).toBe('default')
    })

    it('should apply all CSS variables from theme', () => {
      applyTheme(defaultTheme, 'light')

      const root = document.documentElement
      const cssVars = defaultTheme.light.cssVariables

      Object.keys(cssVars).forEach((key) => {
        const value = root.style.getPropertyValue(key)
        expect(value).toBeTruthy()
      })
    })

    it('should apply different CSS variables for dark mode', () => {
      applyTheme(defaultTheme, 'dark')

      const root = document.documentElement
      const darkVars = defaultTheme.dark.cssVariables

      Object.keys(darkVars).forEach((key) => {
        const value = root.style.getPropertyValue(key)
        expect(value).toBeTruthy()
      })
    })

    it('should inject Google Fonts link and set font CSS variables for UI presets', () => {
      applyTheme(defaultTheme, 'light')

      const link = document.getElementById('dashfy-theme-fonts')
      expect(link).toBeTruthy()
      expect(link?.getAttribute('rel')).toBe('stylesheet')
      expect(link?.getAttribute('href')).toContain('fonts.googleapis.com')
      expect(link?.getAttribute('href')).toContain('family=Geist')

      const sans = document.documentElement.style.getPropertyValue('--font-sans')
      expect(sans).toContain('"Geist"')
    })

    it('should use monospace Google Font stack for minimal theme', () => {
      applyTheme(minimalTheme, 'light')

      const sans = document.documentElement.style.getPropertyValue('--font-sans')
      expect(sans).toContain('Geist Mono')
    })

    it('should apply minimal theme', () => {
      applyTheme(minimalTheme, 'light')

      const root = document.documentElement
      expect(root.getAttribute('data-theme')).toBe('minimal')
    })

    it('should apply nord theme', () => {
      applyTheme(nordTheme, 'light')

      const root = document.documentElement
      expect(root.getAttribute('data-theme')).toBe('nord')
    })

    it('should apply midnight blue theme', () => {
      applyTheme(midnightBlueTheme, 'light')

      const root = document.documentElement
      expect(root.getAttribute('data-theme')).toBe('midnightBlue')
    })

    it('should overwrite previous theme when applying new one', () => {
      applyTheme(defaultTheme, 'light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('default')

      applyTheme(minimalTheme, 'light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('minimal')
    })
  })

  describe('removeTheme', () => {
    it('should remove theme CSS variables', () => {
      applyTheme(defaultTheme, 'light')

      const root = document.documentElement
      expect(root.style.getPropertyValue('--primary')).toBeTruthy()

      removeTheme(defaultTheme)

      expect(root.style.getPropertyValue('--primary')).toBe('')
    })

    it('should remove data-theme attribute', () => {
      applyTheme(defaultTheme, 'light')
      expect(document.documentElement.getAttribute('data-theme')).toBe('default')

      removeTheme(defaultTheme)
      expect(document.documentElement.getAttribute('data-theme')).toBeNull()
    })

    it('should remove all CSS variables from theme', () => {
      applyTheme(defaultTheme, 'light')
      removeTheme(defaultTheme)

      const root = document.documentElement
      const cssVars = defaultTheme.light.cssVariables

      Object.keys(cssVars).forEach((key) => {
        expect(root.style.getPropertyValue(key)).toBe('')
      })
    })

    it('should remove font variables and Google Fonts link', () => {
      applyTheme(defaultTheme, 'light')
      expect(document.getElementById('dashfy-theme-fonts')).toBeTruthy()
      expect(document.documentElement.style.getPropertyValue('--font-sans')).toBeTruthy()

      removeTheme(defaultTheme)

      expect(document.getElementById('dashfy-theme-fonts')).toBeNull()
      expect(document.documentElement.style.getPropertyValue('--font-sans')).toBe('')
    })
  })

  describe('getCurrentTheme', () => {
    it('should return null when no theme is applied', () => {
      expect(getCurrentTheme()).toBeNull()
    })

    it('should return current theme ID after applying theme', () => {
      applyTheme(defaultTheme, 'light')
      expect(getCurrentTheme()).toBe('default')
    })

    it('should return correct theme ID for different themes', () => {
      applyTheme(minimalTheme, 'light')
      expect(getCurrentTheme()).toBe('minimal')

      applyTheme(nordTheme, 'light')
      expect(getCurrentTheme()).toBe('nord')
    })

    it('should return null after removing theme', () => {
      applyTheme(defaultTheme, 'light')
      expect(getCurrentTheme()).toBe('default')

      removeTheme(defaultTheme)
      expect(getCurrentTheme()).toBeNull()
    })
  })

  describe('listThemes', () => {
    it('should return array of theme IDs', () => {
      const themes = listThemes()
      expect(Array.isArray(themes)).toBe(true)
      expect(themes.length).toBeGreaterThan(0)
    })

    it('should include all preset themes', () => {
      const themes = listThemes()
      expect(themes).toContain('default')
      expect(themes).toContain('minimal')
      expect(themes).toContain('nord')
      expect(themes).toContain('midnightBlue')
    })

    it('should return consistent results', () => {
      const themes1 = listThemes()
      const themes2 = listThemes()
      expect(themes1).toEqual(themes2)
    })
  })

  describe('createTheme', () => {
    it('should create custom theme with basic options', () => {
      const customTheme = createTheme({
        id: 'custom',
        name: 'custom',
        displayName: 'Custom Theme',
        lightColors: {
          primary: 'hsl(200 80% 50%)',
        },
      })

      expect(customTheme.id).toBe('custom')
      expect(customTheme.name).toBe('custom')
      expect(customTheme.displayName).toBe('Custom Theme')
      expect(customTheme.light.colors.primary).toBe('hsl(200 80% 50%)')
    })

    it('should inherit fonts from base theme', () => {
      const customTheme = createTheme({
        id: 'custom',
        name: 'custom',
        displayName: 'Custom',
        lightColors: {
          primary: 'hsl(200 80% 50%)',
        },
      })

      expect(customTheme.fonts).toEqual(defaultTheme.fonts)
    })

    it('should allow overriding fonts', () => {
      const customTheme = createTheme({
        id: 'custom',
        name: 'custom',
        displayName: 'Custom',
        lightColors: {
          primary: 'hsl(200 80% 50%)',
        },
        fonts: DEFAULT_FONT_MONO,
      })

      expect(customTheme.fonts?.importHref).toContain('Geist+Mono')
    })

    it('should merge custom colors with base theme', () => {
      const customTheme = createTheme({
        id: 'custom',
        name: 'custom',
        displayName: 'Custom',
        lightColors: {
          primary: 'hsl(200 80% 50%)',
        },
      })

      // Should have custom primary
      expect(customTheme.light.colors.primary).toBe('hsl(200 80% 50%)')
      // Should have other colors from default theme
      expect(customTheme.light.colors.background).toBeDefined()
      expect(customTheme.light.colors.foreground).toBeDefined()
    })

    it('should convert camelCase to kebab-case for CSS variables', () => {
      const customTheme = createTheme({
        id: 'custom',
        name: 'custom',
        displayName: 'Custom',
        lightColors: {
          primaryForeground: 'hsl(0 0% 100%)',
        },
      })

      expect(customTheme.light.cssVariables['--primary-foreground']).toBeDefined()
    })

    it('should handle hsl() format conversion', () => {
      const customTheme = createTheme({
        id: 'custom',
        name: 'custom',
        displayName: 'Custom',
        lightColors: {
          primary: 'hsl(200 80% 50%)',
        },
      })

      // Should convert hsl(200 80% 50%) to space-separated format
      const cssVar = customTheme.light.cssVariables['--primary']
      expect(cssVar).toBe('200 80% 50%')
    })

    it('should create theme with different light and dark colors', () => {
      const customTheme = createTheme({
        id: 'custom',
        name: 'custom',
        displayName: 'Custom',
        lightColors: {
          primary: 'hsl(200 80% 50%)',
        },
        darkColors: {
          primary: 'hsl(200 80% 70%)',
        },
      })

      expect(customTheme.light.colors.primary).toBe('hsl(200 80% 50%)')
      expect(customTheme.dark.colors.primary).toBe('hsl(200 80% 70%)')
    })

    it('should use light colors for dark mode when darkColors not provided', () => {
      const customTheme = createTheme({
        id: 'custom',
        name: 'custom',
        displayName: 'Custom',
        lightColors: {
          primary: 'hsl(200 80% 50%)',
        },
      })

      expect(customTheme.dark.colors.primary).toBe('hsl(200 80% 50%)')
    })

    it('should extend custom base theme', () => {
      const customTheme = createTheme({
        id: 'custom',
        name: 'custom',
        displayName: 'Custom',
        lightColors: {
          primary: 'hsl(200 80% 50%)',
        },
        baseTheme: minimalTheme,
      })

      // Should have custom primary
      expect(customTheme.light.colors.primary).toBe('hsl(200 80% 50%)')
      // Should have other colors from minimal theme
      expect(customTheme.light.colors.background).toBe(minimalTheme.light.colors.background)
    })

    it('should create theme that can be applied', () => {
      const customTheme = createTheme({
        id: 'ocean',
        name: 'ocean',
        displayName: 'Ocean',
        lightColors: {
          primary: 'hsl(200 80% 50%)',
        },
      })

      applyTheme(customTheme, 'light')

      expect(document.documentElement.getAttribute('data-theme')).toBe('ocean')
      expect(document.documentElement.style.getPropertyValue('--primary')).toBeTruthy()
    })

    it('should handle multiple color overrides', () => {
      const customTheme = createTheme({
        id: 'custom',
        name: 'custom',
        displayName: 'Custom',
        lightColors: {
          primary: 'hsl(200 80% 50%)',
          secondary: 'hsl(180 70% 50%)',
          accent: 'hsl(160 60% 50%)',
        },
      })

      expect(customTheme.light.colors.primary).toBe('hsl(200 80% 50%)')
      expect(customTheme.light.colors.secondary).toBe('hsl(180 70% 50%)')
      expect(customTheme.light.colors.accent).toBe('hsl(160 60% 50%)')
    })

    it('should preserve base theme CSS variables not overridden', () => {
      const customTheme = createTheme({
        id: 'custom',
        name: 'custom',
        displayName: 'Custom',
        lightColors: {
          primary: 'hsl(200 80% 50%)',
        },
      })

      // Should have all CSS variables from base theme
      const baseVarCount = Object.keys(defaultTheme.light.cssVariables).length
      const customVarCount = Object.keys(customTheme.light.cssVariables).length
      expect(customVarCount).toBeGreaterThanOrEqual(baseVarCount)
    })
  })

  describe('SSR safety', () => {
    it('applyTheme should handle undefined document', () => {
      const originalDocument = global.document
      // @ts-expect-error - Testing SSR scenario
      global.document = undefined

      expect(() => applyTheme(defaultTheme, 'light')).not.toThrow()

      global.document = originalDocument
    })

    it('removeTheme should handle undefined document', () => {
      const originalDocument = global.document
      // @ts-expect-error - Testing SSR scenario
      global.document = undefined

      expect(() => removeTheme(defaultTheme)).not.toThrow()

      global.document = originalDocument
    })

    it('getCurrentTheme should return null with undefined document', () => {
      const originalDocument = global.document
      // @ts-expect-error - Testing SSR scenario
      global.document = undefined

      expect(getCurrentTheme()).toBeNull()

      global.document = originalDocument
    })
  })
})
