import { DEFAULT_FONTS_FALLBACK, googleFont } from './googleFont'

/**
 * [Geist](https://fonts.google.com/specimen/Geist) + [Geist Mono](https://fonts.google.com/specimen/Geist+Mono) via the [Google Fonts CSS API](https://developers.google.com/fonts/docs/css2).
 * `applyTheme` injects `importHref` as `<link rel="stylesheet">` on the document.
 */
export const DEFAULT_FONT = googleFont({
  sans: { family: 'Geist', weights: [400, 500, 600, 700] },
  mono: { family: 'Geist Mono', weights: [400, 500, 600, 700] },
})

/**
 * Geist Mono ([Google Fonts](https://fonts.google.com/specimen/Geist+Mono)).
 */
export const DEFAULT_FONT_MONO = googleFont({
  sans: {
    family: 'Geist Mono',
    weights: [400, 500, 600, 700],
    fallback: DEFAULT_FONTS_FALLBACK.mono,
  },
  mono: { family: 'Geist Mono', weights: [400, 500, 600, 700] },
})
