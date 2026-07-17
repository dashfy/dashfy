import { highlighter } from '@/utils/highlighter'
import { isQuiet } from '@/utils/output'

/**
 * Minimal console logger with consistent formatting. Human-facing output is
 * suppressed when the CLI runs in a quiet mode (`--json` / `--silent`); errors
 * always print, and `data` always writes to stdout (the machine channel).
 */
export const logger = {
  break() {
    if (isQuiet()) {
      return
    }
    console.log('')
  },
  log(message: string) {
    if (isQuiet()) {
      return
    }
    console.log(message)
  },
  info(message: string) {
    if (isQuiet()) {
      return
    }
    console.log(`${highlighter.info('info')} ${message}`)
  },
  success(message: string) {
    if (isQuiet()) {
      return
    }
    console.log(`${highlighter.success('success')} ${message}`)
  },
  warn(message: string) {
    if (isQuiet()) {
      return
    }
    console.warn(`${highlighter.warn('warn')} ${message}`)
  },
  error(message: string) {
    console.error(`${highlighter.error('error')} ${message}`)
  },
  /** Writes machine-facing output (e.g. JSON) to stdout, regardless of mode. */
  data(message: string) {
    console.log(message)
  },
}
