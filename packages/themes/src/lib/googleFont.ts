import type { ThemeFonts } from '@/types'

export const DEFAULT_FONTS_FALLBACK: Record<string, string> = {
  sans: 'ui-sans-serif, system-ui, sans-serif',
  serif: 'ui-serif, Georgia, serif',
  mono: 'ui-monospace, SFMono-Regular, monospace',
}

const GOOGLE_FONTS_BASE = 'https://fonts.googleapis.com/css2'

export interface GoogleFontEntry {
  /** Font family name exactly as it appears on fonts.google.com (e.g. `'Source Serif 4'`). */
  family: string
  /** Numeric weights to load (default: `[400]`). */
  weights?: number[]
  /** Override the default fallback stack (e.g. `'serif'`). */
  fallback?: string
}

export interface GoogleFontConfig {
  sans: GoogleFontEntry
  serif?: GoogleFontEntry
  mono: GoogleFontEntry
}

/**
 * Build a {@link ThemeFonts} object from a declarative config, so you never
 * have to hand-craft Google Fonts URLs or CSS variable fallback stacks.
 *
 * @example
 * ```ts
 * import { googleFont } from '@getdashfy/themes'
 *
 * const fonts = googleFont({
 *   sans:  { family: 'Merriweather', weights: [400, 500, 600, 700], fallback: 'serif' },
 *   serif: { family: 'Source Serif 4', weights: [400, 500, 600, 700], fallback: 'serif' },
 *   mono:  { family: 'JetBrains Mono', weights: [400, 500, 600, 700] },
 * })
 * ```
 */
export function googleFont(config: GoogleFontConfig): ThemeFonts {
  const entries = Object.entries(config) as [keyof GoogleFontConfig, GoogleFontEntry][]

  const familyParams = entries
    .map(([, entry]) => {
      const encoded = entry.family.replace(/ /g, '+')
      const weights = entry.weights ?? [400]
      return `family=${encoded}:wght@${weights.join(';')}`
    })
    .join('&')

  const importHref = `${GOOGLE_FONTS_BASE}?${familyParams}&display=swap`

  const cssVar = (role: keyof GoogleFontConfig, entry: GoogleFontEntry) =>
    `"${entry.family}", ${entry.fallback ?? DEFAULT_FONTS_FALLBACK[role]}`

  const cssVariables: ThemeFonts['cssVariables'] = {
    '--font-sans': cssVar('sans', config.sans),
    '--font-mono': cssVar('mono', config.mono),
  }

  if (config.serif) {
    cssVariables['--font-serif'] = cssVar('serif', config.serif)
  }

  return { importHref, cssVariables }
}
