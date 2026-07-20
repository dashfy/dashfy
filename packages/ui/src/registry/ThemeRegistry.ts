import type { Theme } from '@dashfy/themes'
import { DEFAULT_THEME, getTheme, listThemes } from '@dashfy/themes'
import type { ThemeId } from '@getdashfy/types'

/**
 * Global registry for managing theme configurations.
 *
 * Provides a centralized system for registering, retrieving, and managing themes.
 * Themes are identified by unique IDs (e.g., "default", "nord", "midnightBlue").
 *
 * Supports:
 * - Individual theme registration
 * - Bulk theme registration
 * - Load all built-in themes from @dashfy/themes
 * - Default theme configuration
 * - Theme lookup by ID
 *
 * @example
 * ```tsx
 * // Load all themes from @dashfy/themes
 * ThemeRegistry.loadAllThemes()
 *
 * // Or register themes individually
 * ThemeRegistry.add(defaultTheme)
 * ThemeRegistry.add(nordTheme)
 *
 * // Or register multiple at once
 * ThemeRegistry.addAll([defaultTheme, nordTheme, minimalTheme])
 *
 * // Set default theme
 * ThemeRegistry.defaultTheme = 'nord'
 *
 * // Retrieve a theme
 * const theme = ThemeRegistry.get('nord')
 * ```
 */
class ThemeRegistryClass {
  private themes = new Map<ThemeId, Theme>()
  private _defaultTheme: ThemeId = DEFAULT_THEME

  /**
   * Register a single theme.
   *
   * @param theme - Theme configuration object
   */
  public add(theme: Theme): void {
    this.themes.set(theme.id, theme)
  }

  /**
   * Register multiple themes at once.
   *
   * @param themes - Array of theme configuration objects
   */
  public addAll(themes: Theme[]): void {
    themes.forEach((theme) => this.add(theme))
  }

  /**
   * Register all themes from @dashfy/themes.
   */
  public loadAllThemes(): void {
    listThemes().forEach((id) => {
      const theme = getTheme(id)
      this.add(theme)
    })
  }

  /**
   * Get a theme by ID.
   *
   * @param id - Theme identifier
   * @returns Theme object or undefined if not found
   */
  public get(id: ThemeId): Theme | undefined {
    return this.themes.get(id)
  }

  /**
   * Check if a theme is registered.
   *
   * @param id - Theme identifier
   * @returns true if theme is registered
   */
  public has(id: ThemeId): boolean {
    return this.themes.has(id)
  }

  /**
   * Unregister a theme.
   *
   * @param id - Theme identifier
   */
  public remove(id: ThemeId): void {
    this.themes.delete(id)
  }

  /**
   * Get all registered theme IDs.
   *
   * @returns Array of theme IDs
   */
  public list(): ThemeId[] {
    return Array.from(this.themes.keys())
  }

  /**
   * Get all registered themes as an object.
   *
   * @returns Object mapping theme IDs to theme objects
   */
  public getAll(): Record<ThemeId, Theme> {
    return Object.fromEntries(this.themes.entries())
  }

  /**
   * Get count of registered themes.
   *
   * @returns Number of registered themes
   */
  public get size(): number {
    return this.themes.size
  }

  /**
   * Set the default theme ID.
   *
   * @param themeId - Theme identifier to set as default
   * @throws Error if theme is not registered
   */
  public set defaultTheme(themeId: ThemeId) {
    if (!this.has(themeId)) {
      const availableThemes = this.list()

      if (availableThemes.length === 0) {
        throw new Error(
          `Theme "${themeId}" is not registered. No themes have been registered yet.\n\n` +
            `Please register themes before setting a default:\n\n` +
            `  import { ThemeRegistry } from '@dashfy/ui'\n` +
            `  import { defaultTheme, nordTheme } from '@dashfy/themes'\n\n` +
            `  ThemeRegistry.addAll([defaultTheme, nordTheme])\n` +
            `  ThemeRegistry.defaultTheme = '${themeId}'`,
        )
      }

      throw new Error(
        `Theme "${themeId}" is not registered. Available themes: ${availableThemes.join(', ')}`,
      )
    }

    this._defaultTheme = themeId
  }

  /**
   * Get the default theme ID.
   *
   * @returns Default theme identifier
   */
  public get defaultTheme(): ThemeId {
    return this._defaultTheme
  }

  /**
   * Get the default theme object.
   *
   * @returns Default theme or undefined if not found
   */
  public getDefault(): Theme | undefined {
    return this.get(this._defaultTheme)
  }

  /**
   * Clear all registered themes.
   */
  public clear(): void {
    this.themes.clear()
    this._defaultTheme = DEFAULT_THEME
  }
}

// Export singleton instance
export const ThemeRegistry = new ThemeRegistryClass()
