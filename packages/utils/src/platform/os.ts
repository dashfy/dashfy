/**
 * Check if the current platform is macOS.
 */
export const isMac =
  typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC')

/**
 * Get the modifier key symbol based on the current platform.
 *
 * @returns '⌘' for macOS, 'Ctrl' for other platforms
 *
 * @example
 * ```ts
 * // On macOS
 * `Press ${modKey}+S to save` // => 'Press ⌘+S to save'
 *
 * // On Windows/Linux
 * `Press ${modKey}+S to save` // => 'Press Ctrl+S to save'
 * ```
 */
export const modKey = isMac ? '⌘' : 'Ctrl'
