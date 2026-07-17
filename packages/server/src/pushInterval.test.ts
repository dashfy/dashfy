import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createPushIntervalFactory } from './pushInterval'

const createMockLogger = () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => {
    return createMockLogger()
  }),
})

describe('createPushIntervalFactory', () => {
  let mockLogger: ReturnType<typeof createMockLogger>

  beforeEach(() => {
    mockLogger = createMockLogger()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('factory creation', () => {
    it('should return a function when called with interval options', () => {
      const createPushInterval = createPushIntervalFactory(mockLogger as never, 'testApi')

      expect(createPushInterval).toBeTypeOf('function')

      const startPushInterval = createPushInterval({ interval: 1000 })

      expect(startPushInterval).toBeTypeOf('function')
    })

    it('should use default interval (2000ms) when options omitted', async () => {
      const createPushInterval = createPushIntervalFactory(mockLogger as never, 'testApi')
      const startPushInterval = createPushInterval()

      const callback = vi.fn()
      const fetchFn = vi.fn().mockResolvedValue({ ok: true })

      startPushInterval('testKey', callback, fetchFn)

      await vi.runOnlyPendingTimersAsync()

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[testApi.testKey] Started push interval (2000ms)',
      )
    })
  })

  describe('push behavior', () => {
    it('should call callback with fetched data', async () => {
      const createPushInterval = createPushIntervalFactory(mockLogger as never, 'testApi')
      const startPushInterval = createPushInterval({ interval: 10_000 })

      const callback = vi.fn()
      const fetchFn = vi.fn().mockResolvedValue({ data: 'initial' })

      startPushInterval('testKey', callback, fetchFn)

      // Flush promise from initial pushData (no timer advance - interval is 10s)
      await vi.runOnlyPendingTimersAsync()

      expect(fetchFn).toHaveBeenCalled()
      expect(callback).toHaveBeenCalledWith({ data: 'initial' })
    })

    it('should push data at the configured interval', async () => {
      const createPushInterval = createPushIntervalFactory(mockLogger as never, 'testApi')
      const startPushInterval = createPushInterval({ interval: 100 })

      const receivedValues: number[] = []
      const callback = vi.fn((data: unknown) => {
        receivedValues.push((data as { v: number }).v)
      })
      let nextValue = 0
      const fetchFn = vi.fn().mockImplementation(() => Promise.resolve({ v: ++nextValue }))

      startPushInterval('testKey', callback, fetchFn)

      // Initial call
      await Promise.resolve()
      await Promise.resolve()
      expect(receivedValues).toContain(1)

      // Advance and run interval(s)
      vi.advanceTimersByTime(100)
      await vi.runOnlyPendingTimersAsync()
      expect(receivedValues.filter((v) => v === 2).length).toBeGreaterThan(0)

      vi.advanceTimersByTime(100)
      await vi.runOnlyPendingTimersAsync()
      expect(receivedValues.filter((v) => v === 3).length).toBeGreaterThan(0)
    })

    it('should handle fetch errors and log without crashing', async () => {
      const createPushInterval = createPushIntervalFactory(mockLogger as never, 'testApi')
      const startPushInterval = createPushInterval({ interval: 10_000 })

      const callback = vi.fn()
      const fetchFn = vi.fn().mockRejectedValue(new Error('Fetch failed'))

      startPushInterval('testKey', callback, fetchFn)

      await vi.runOnlyPendingTimersAsync()

      expect(callback).not.toHaveBeenCalled()
      expect(mockLogger.error).toHaveBeenCalledWith('[testApi.testKey] Error: Fetch failed')
    })
  })

  describe('logging', () => {
    it('should log with prefix when prefix is provided', async () => {
      const createPushInterval = createPushIntervalFactory(mockLogger as never, 'system')
      const startPushInterval = createPushInterval({ interval: 2000 })

      const callback = vi.fn()
      const fetchFn = vi.fn().mockResolvedValue({ ok: true })

      startPushInterval('cpuUsage', callback, fetchFn)

      await vi.runOnlyPendingTimersAsync()

      expect(mockLogger.info).toHaveBeenCalledWith(
        '[system.cpuUsage] Started push interval (2000ms)',
      )
    })

    it('should log with key only when prefix is empty', async () => {
      const createPushInterval = createPushIntervalFactory(mockLogger as never, '')
      const startPushInterval = createPushInterval({ interval: 500 })

      const callback = vi.fn()
      const fetchFn = vi.fn().mockResolvedValue({ ok: true })

      startPushInterval('myKey', callback, fetchFn)

      await vi.runOnlyPendingTimersAsync()

      expect(mockLogger.info).toHaveBeenCalledWith('[myKey] Started push interval (500ms)')
    })

    it('should log error with correct prefix', async () => {
      const createPushInterval = createPushIntervalFactory(mockLogger as never, 'metrics')
      const startPushInterval = createPushInterval({ interval: 10_000 })

      const callback = vi.fn()
      const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'))

      startPushInterval('health', callback, fetchFn)

      await vi.runOnlyPendingTimersAsync()

      expect(mockLogger.error).toHaveBeenCalledWith('[metrics.health] Error: Network error')
    })
  })

  describe('deduplication', () => {
    it('should not start duplicate interval for the same key', async () => {
      const createPushInterval = createPushIntervalFactory(mockLogger as never, 'api')
      const startPushInterval = createPushInterval({ interval: 10_000 })

      const callback = vi.fn()
      const fetchFn = vi.fn().mockResolvedValue({ data: 'test' })

      startPushInterval('endpoint', callback, fetchFn)
      startPushInterval('endpoint', callback, fetchFn)
      startPushInterval('endpoint', callback, fetchFn)

      await vi.runOnlyPendingTimersAsync()

      expect(mockLogger.info).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith('[api.endpoint] Started push interval (10000ms)')
    })

    it('should allow separate intervals for different keys', async () => {
      const createPushInterval = createPushIntervalFactory(mockLogger as never, 'api')
      const startPushInterval = createPushInterval({ interval: 10_000 })

      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const fetchFn1 = vi.fn().mockResolvedValue({ key: 'a' })
      const fetchFn2 = vi.fn().mockResolvedValue({ key: 'b' })

      startPushInterval('keyA', callback1, fetchFn1)
      startPushInterval('keyB', callback2, fetchFn2)

      await vi.runOnlyPendingTimersAsync()

      expect(mockLogger.info).toHaveBeenCalledTimes(2)
      expect(mockLogger.info).toHaveBeenCalledWith('[api.keyA] Started push interval (10000ms)')
      expect(mockLogger.info).toHaveBeenCalledWith('[api.keyB] Started push interval (10000ms)')
      expect(callback1).toHaveBeenCalledWith({ key: 'a' })
      expect(callback2).toHaveBeenCalledWith({ key: 'b' })
    })
  })

  describe('multiple interval configs', () => {
    it('should create independent interval scopes per createPushInterval call', async () => {
      const createPushInterval = createPushIntervalFactory(mockLogger as never, 'api')

      const startInterval100 = createPushInterval({ interval: 100 })
      const startInterval200 = createPushInterval({ interval: 200 })

      const callback100 = vi.fn()
      const callback200 = vi.fn()
      const fetchFn100 = vi.fn().mockResolvedValue({ interval: 100 })
      const fetchFn200 = vi.fn().mockResolvedValue({ interval: 200 })

      startInterval100('fast', callback100, fetchFn100)
      startInterval200('slow', callback200, fetchFn200)

      await Promise.resolve()
      await Promise.resolve()

      expect(callback100).toHaveBeenCalledWith({ interval: 100 })
      expect(callback200).toHaveBeenCalledWith({ interval: 200 })

      const count100AfterInit = callback100.mock.calls.length
      const count200AfterInit = callback200.mock.calls.length

      // Advance 200ms - fast should fire 2x, slow 1x
      vi.advanceTimersByTime(200)
      await vi.runOnlyPendingTimersAsync()

      expect(callback100.mock.calls.length).toBeGreaterThan(count100AfterInit)
      expect(callback200.mock.calls.length).toBeGreaterThan(count200AfterInit)
    })
  })

  describe('stop', () => {
    it('should return a function that stops the interval', async () => {
      const createPushInterval = createPushIntervalFactory(mockLogger as never, 'api')
      const startPushInterval = createPushInterval({ interval: 100 })

      const callback = vi.fn()
      const fetchFn = vi.fn().mockResolvedValue({ ok: true })

      const stop = startPushInterval('endpoint', callback, fetchFn)

      expect(stop).toBeTypeOf('function')

      await vi.runOnlyPendingTimersAsync()
      const callsBeforeStop = callback.mock.calls.length

      stop()

      vi.advanceTimersByTime(1000)
      await vi.runOnlyPendingTimersAsync()

      expect(callback.mock.calls.length).toBe(callsBeforeStop)
      expect(mockLogger.info).toHaveBeenCalledWith('[api.endpoint] Stopped push interval')
    })

    it('should be safe to call stop multiple times', () => {
      const createPushInterval = createPushIntervalFactory(mockLogger as never, 'api')
      const startPushInterval = createPushInterval({ interval: 100 })

      const stop = startPushInterval('endpoint', vi.fn(), vi.fn().mockResolvedValue({}))

      stop()
      stop()
      stop()

      const stopLogs = mockLogger.info.mock.calls.filter(
        (call) => call[0] === '[api.endpoint] Stopped push interval',
      )

      expect(stopLogs.length).toBe(1)
    })

    it('should allow restarting an interval after stop', async () => {
      const createPushInterval = createPushIntervalFactory(mockLogger as never, 'api')
      const startPushInterval = createPushInterval({ interval: 100 })

      const callback = vi.fn()
      const fetchFn = vi.fn().mockResolvedValue({ ok: true })

      const stop = startPushInterval('endpoint', callback, fetchFn)

      await vi.runOnlyPendingTimersAsync()
      stop()

      const callsAfterStop = callback.mock.calls.length

      startPushInterval('endpoint', callback, fetchFn)

      await vi.runOnlyPendingTimersAsync()
      vi.advanceTimersByTime(100)
      await vi.runOnlyPendingTimersAsync()

      expect(callback.mock.calls.length).toBeGreaterThan(callsAfterStop)

      const startLogs = mockLogger.info.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' && call[0].startsWith('[api.endpoint] Started push interval'),
      )

      expect(startLogs.length).toBe(2)
    })

    it('should return the existing stop when called again for the same key', async () => {
      const createPushInterval = createPushIntervalFactory(mockLogger as never, 'api')
      const startPushInterval = createPushInterval({ interval: 100 })

      const callback = vi.fn()
      const fetchFn = vi.fn().mockResolvedValue({ ok: true })

      startPushInterval('endpoint', callback, fetchFn)
      const stopFromSecondCall = startPushInterval('endpoint', callback, fetchFn)

      await vi.runOnlyPendingTimersAsync()

      stopFromSecondCall()
      vi.advanceTimersByTime(1000)
      await vi.runOnlyPendingTimersAsync()
      const callsAfterStop = callback.mock.calls.length
      vi.advanceTimersByTime(1000)
      await vi.runOnlyPendingTimersAsync()

      expect(callback.mock.calls.length).toBe(callsAfterStop)
    })
  })
})
