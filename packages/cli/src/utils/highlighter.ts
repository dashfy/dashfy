import pc from 'picocolors'

/**
 * Small color helper used across the CLI for consistent output styling.
 */
export const highlighter = {
  error: (text: string) => pc.red(text),
  warn: (text: string) => pc.yellow(text),
  info: (text: string) => pc.cyan(text),
  success: (text: string) => pc.green(text),
  dim: (text: string) => pc.dim(text),
  bold: (text: string) => pc.bold(text),
}
