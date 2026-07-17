import { defaultTheme } from './default'
import { kodamaGroveTheme } from './kodamaGrove'
import { midnightBlueTheme } from './midnightBlue'
import { minimalTheme } from './minimal'
import { nordTheme } from './nord'

export const themes = {
  default: defaultTheme,
  kodamaGrove: kodamaGroveTheme,
  midnightBlue: midnightBlueTheme,
  minimal: minimalTheme,
  nord: nordTheme,
} as const

export type PresetThemeId = keyof typeof themes

export { defaultTheme, kodamaGroveTheme, midnightBlueTheme, minimalTheme, nordTheme }
