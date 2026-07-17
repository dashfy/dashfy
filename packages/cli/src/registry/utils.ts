/** Returns true when the string parses as an absolute URL. */
export function isUrl(value: string): boolean {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

/** Returns true for a local `.json` file path (anything that is not a URL). */
export function isLocalFile(value: string): boolean {
  return value.endsWith('.json') && !isUrl(value)
}
