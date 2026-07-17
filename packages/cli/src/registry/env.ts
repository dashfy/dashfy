const ENV_VAR_PATTERN = /\$\{(\w+)\}/g

/** Replaces `${VAR}` occurrences with the matching environment variable. */
export function expandEnvVars(value: string): string {
  return value.replace(ENV_VAR_PATTERN, (_match, key: string) => process.env[key] ?? '')
}

/** Extracts the names of all `${VAR}` placeholders in a string. */
export function extractEnvVars(value: string): string[] {
  const vars: string[] = []
  let match: RegExpExecArray | null
  ENV_VAR_PATTERN.lastIndex = 0
  while ((match = ENV_VAR_PATTERN.exec(value)) !== null) {
    if (match[1]) {
      vars.push(match[1])
    }
  }
  return vars
}
