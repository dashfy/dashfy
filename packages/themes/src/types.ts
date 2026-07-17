export type { ThemeMode } from '@dashfy/types'

export interface ThemeColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  success: string
  successForeground: string
  warning: string
  warningForeground: string
  error: string
  errorForeground: string
  info: string
  infoForeground: string
  border: string
  input: string
  ring: string
  chart1: string
  chart2: string
  chart3: string
  chart4: string
  chart5: string
}

export interface ThemeFonts {
  importHref: string
  cssVariables: {
    '--font-sans': string
    '--font-serif'?: string
    '--font-mono': string
  }
}

export interface Theme {
  id: string
  name: string
  displayName: string
  fonts?: ThemeFonts
  light: {
    colors: ThemeColors
    cssVariables: Record<string, string>
  }
  dark: {
    colors: ThemeColors
    cssVariables: Record<string, string>
  }
}
