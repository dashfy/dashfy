/**
 * Global output mode for the CLI, set once from the root command's
 * `--json` / `--silent` flags. Read by the logger and spinner so every command
 * gets a consistent machine-readable / quiet surface without branching on flags
 * individually.
 */
export interface OutputMode {
  /** Emit machine-readable JSON only; suppress all human chrome. */
  json: boolean
  /** Mute non-error logs and spinners. */
  silent: boolean
}

const mode: OutputMode = {
  json: false,
  silent: false,
}

export function setOutputMode(next: Partial<OutputMode>): void {
  if (typeof next.json === 'boolean') {
    mode.json = next.json
  }
  if (typeof next.silent === 'boolean') {
    mode.silent = next.silent
  }
}

export function getOutputMode(): OutputMode {
  return { ...mode }
}

/** True when human-facing chrome (info/success/spinners) should be suppressed. */
export function isQuiet(): boolean {
  return mode.json || mode.silent
}

/** True when output should be machine-readable JSON. */
export function isJson(): boolean {
  return mode.json
}
