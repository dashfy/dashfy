import { afterEach, describe, expect, it, vi } from 'vitest'

describe('platform/os', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('should export isMac as boolean', async () => {
    const { isMac } = await import('./os')
    expect(typeof isMac).toBe('boolean')
  })

  it('should export modKey as string', async () => {
    const { modKey } = await import('./os')
    expect(typeof modKey).toBe('string')
  })

  it('should have modKey as Ctrl when not on Mac (Node/navigator undefined)', async () => {
    vi.stubGlobal('navigator', undefined)
    vi.resetModules()
    const { modKey } = await import('./os')
    expect(modKey).toBe('Ctrl')
  })

  it('should have modKey as Ctrl when navigator.platform does not include MAC', async () => {
    vi.stubGlobal('navigator', { platform: 'Win32' })
    vi.resetModules()
    const { modKey } = await import('./os')
    expect(modKey).toBe('Ctrl')
  })

  it('should have modKey as ⌘ when navigator.platform includes MAC', async () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel' })
    vi.resetModules()
    const { modKey } = await import('./os')
    expect(modKey).toBe('⌘')
  })

  it('should have modKey be one of the expected values', async () => {
    const { modKey } = await import('./os')
    expect(['⌘', 'Ctrl']).toContain(modKey)
  })
})
