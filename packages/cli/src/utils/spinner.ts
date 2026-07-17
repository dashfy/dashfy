import { highlighter } from '@/utils/highlighter'
import { isQuiet } from '@/utils/output'

const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const INTERVAL_MS = 80

export interface Spinner {
  start: (text?: string) => Spinner
  succeed: (text?: string) => Spinner
  fail: (text?: string) => Spinner
  stop: () => Spinner
}

/**
 * Tiny dependency-free terminal spinner. Falls back to plain log lines when
 * stdout is not a TTY (e.g. CI), and is muted in quiet modes (`--json` /
 * `--silent`) unless an explicit `silent` value is provided.
 */
export function spinner(initialText: string, options?: { silent?: boolean }): Spinner {
  let text = initialText
  let frame = 0
  let timer: NodeJS.Timeout | undefined
  const silent = options?.silent ?? isQuiet()
  const isTTY = Boolean(process.stdout.isTTY) && !silent

  const render = () => {
    const symbol = highlighter.info(FRAMES[frame] ?? '')
    frame = (frame + 1) % FRAMES.length
    process.stdout.write(`\r${symbol} ${text}`)
  }

  const clearLine = () => {
    if (isTTY) {
      process.stdout.write('\r\x1b[K')
    }
  }

  const api: Spinner = {
    start(nextText?: string) {
      if (nextText) {
        text = nextText
      }
      if (silent) {
        return api
      }
      if (!isTTY) {
        console.log(`${highlighter.info('...')} ${text}`)
        return api
      }
      render()
      timer = setInterval(render, INTERVAL_MS)
      return api
    },
    stop() {
      if (timer) {
        clearInterval(timer)
        timer = undefined
      }
      clearLine()
      return api
    },
    succeed(nextText?: string) {
      api.stop()
      if (!silent) {
        console.log(`${highlighter.success('✓')} ${nextText ?? text}`)
      }
      return api
    },
    fail(nextText?: string) {
      api.stop()
      if (!silent) {
        console.log(`${highlighter.error('✗')} ${nextText ?? text}`)
      }
      return api
    },
  }

  return api
}
