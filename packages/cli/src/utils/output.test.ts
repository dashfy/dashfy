import { afterEach, describe, expect, it, vi } from 'vitest'

import { logger } from '@/utils/logger'
import { isJson, isQuiet, setOutputMode } from '@/utils/output'

afterEach(() => {
  setOutputMode({ json: false, silent: false })
  vi.restoreAllMocks()
})

describe('output mode', () => {
  it('defaults to non-quiet, non-json', () => {
    expect(isQuiet()).toBe(false)
    expect(isJson()).toBe(false)
  })

  it('silent is quiet but not json', () => {
    setOutputMode({ silent: true })
    expect(isQuiet()).toBe(true)
    expect(isJson()).toBe(false)
  })

  it('json implies quiet', () => {
    setOutputMode({ json: true })
    expect(isQuiet()).toBe(true)
    expect(isJson()).toBe(true)
  })
})

describe('logger respects quiet mode', () => {
  it('suppresses info/log but still emits data and error', () => {
    setOutputMode({ silent: true })
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    logger.info('hidden')
    logger.log('hidden')
    expect(log).not.toHaveBeenCalled()

    logger.data('{"ok":true}')
    expect(log).toHaveBeenCalledWith('{"ok":true}')

    logger.error('boom')
    expect(error).toHaveBeenCalled()
  })
})
