import type { APIRegistration, PollMode } from '@dashfy/types'
import { WebSocketEvent } from '@dashfy/types'
import type { Socket } from 'socket.io'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Bus } from './bus'
import { DEFAULT_POLL_INTERVAL } from './constants'

// Mock logger
const createMockLogger = () => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => createMockLogger()),
})

// Mock socket
const createMockSocket = (id: string): Socket => {
  return {
    id,
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as Socket
}

describe('Bus', () => {
  let bus: Bus
  let mockLogger: ReturnType<typeof createMockLogger>

  beforeEach(() => {
    mockLogger = createMockLogger()
    bus = new Bus({
      logger: mockLogger as any,
      pollInterval: 1000,
    })
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('constructor', () => {
    it('should initialize with provided options', () => {
      expect(bus.pollInterval).toBe(1000)
    })

    it('should use default poll interval when not provided', () => {
      const busWithDefaults = new Bus({ logger: mockLogger as any })
      expect(busWithDefaults.pollInterval).toBe(DEFAULT_POLL_INTERVAL)
    })

    it('should use nullish coalescing for pollInterval', () => {
      const busWithZero = new Bus({ logger: mockLogger as any, pollInterval: 0 })
      expect(busWithZero.pollInterval).toBe(0)
    })
  })

  describe('registerApi', () => {
    it('should register a poll-mode API', () => {
      const mockApi: APIRegistration = () => ({
        testMethod: async () => Promise.resolve({ data: 'test' }),
      })

      bus.registerApi('testApi', mockApi, 'poll')

      expect(mockLogger.info).toHaveBeenCalledWith("Registered API 'testApi' (mode: poll)")
    })

    it('should register a push-mode API', () => {
      const mockApi: APIRegistration = () => ({
        testMethod: (callback: (data: unknown) => void) => {
          callback({ data: 'pushed' })
          return Promise.resolve()
        },
      })

      bus.registerApi('pushApi', mockApi, 'push')

      expect(mockLogger.info).toHaveBeenCalledWith("Registered API 'pushApi' (mode: push)")
    })

    it('should default to poll mode when mode not specified', () => {
      const mockApi: APIRegistration = () => ({
        testMethod: async () => Promise.resolve({ data: 'test' }),
      })

      bus.registerApi('defaultApi', mockApi)

      expect(mockLogger.info).toHaveBeenCalledWith("Registered API 'defaultApi' (mode: poll)")
    })

    it('should throw error for invalid mode', () => {
      const mockApi: APIRegistration = () => ({})

      expect(() => {
        bus.registerApi('testApi', mockApi, 'invalid' as PollMode)
      }).toThrow("Invalid API mode: invalid. Must be 'poll' or 'push'")

      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should throw error when registering duplicate API', () => {
      const mockApi: APIRegistration = () => ({})

      bus.registerApi('testApi', mockApi)

      expect(() => {
        bus.registerApi('testApi', mockApi)
      }).toThrow("API 'testApi' is already registered")

      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should pass logger and request to API registration', () => {
      const mockApi: APIRegistration = vi.fn(() => ({}))

      bus.registerApi('testApi', mockApi)

      expect(mockLogger.child).toHaveBeenCalledWith({ api: 'testApi' })
      expect(mockApi).toHaveBeenCalledWith({
        logger: expect.any(Object),
        request: expect.any(Function),
        createPushInterval: expect.any(Function),
      })
    })
  })

  describe('listApis', () => {
    it('should return empty array when no APIs registered', () => {
      expect(bus.listApis()).toEqual([])
    })

    it('should return registered API IDs in alphabetical order', () => {
      const mockApi: APIRegistration = () => ({})

      bus.registerApi('zebra', mockApi)
      bus.registerApi('alpha', mockApi)

      expect(bus.listApis()).toEqual(['alpha', 'zebra'])
    })
  })

  describe('addClient', () => {
    it('should add a new client', () => {
      const socket = createMockSocket('client1')

      bus.addClient(socket)

      expect(mockLogger.info).toHaveBeenCalledWith('Client with id client1 connected')
    })

    it('should throw error when adding duplicate client', () => {
      const socket = createMockSocket('client1')

      bus.addClient(socket)

      expect(() => {
        bus.addClient(socket)
      }).toThrow('Client with id client1 already registered')

      expect(mockLogger.error).toHaveBeenCalled()
    })
  })

  describe('removeClient', () => {
    it('should remove an existing client', () => {
      const socket = createMockSocket('client1')

      bus.addClient(socket)
      bus.removeClient('client1')

      expect(mockLogger.info).toHaveBeenCalledWith('Client with id client1 disconnected')
    })

    it('should throw error when removing non-existent client', () => {
      expect(() => {
        bus.removeClient('nonexistent')
      }).toThrow('Client with id nonexistent not found')

      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should clean up client subscriptions when removing client', () => {
      const socket = createMockSocket('client1')
      const mockApi: APIRegistration = () => ({
        testMethod: async () => Promise.resolve({ data: 'test' }),
      })

      bus.registerApi('testApi', mockApi, 'poll')
      bus.addClient(socket)
      bus.subscribe('client1', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })

      bus.removeClient('client1')

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Removed subscription testApi.testMethod (no clients)',
      )
    })
  })

  describe('clientCount', () => {
    it('should return 0 when no clients connected', () => {
      expect(bus.clientCount()).toBe(0)
    })

    it('should return correct number of connected clients', () => {
      bus.addClient(createMockSocket('client1'))
      bus.addClient(createMockSocket('client2'))
      bus.addClient(createMockSocket('client3'))

      expect(bus.clientCount()).toBe(3)
    })
  })

  describe('subscribe', () => {
    beforeEach(() => {
      const mockApi: APIRegistration = () => ({
        testMethod: async () => Promise.resolve({ data: 'test' }),
        pushMethod: (callback: (data: unknown) => void) => {
          callback({ data: 'pushed' })
          return Promise.resolve()
        },
      })

      bus.registerApi('testApi', mockApi, 'poll')
      bus.registerApi('pushApi', mockApi, 'push')
    })

    it('should subscribe client to poll-mode API', () => {
      const socket = createMockSocket('client1')
      bus.addClient(socket)

      bus.subscribe('client1', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })

      expect(mockLogger.info).toHaveBeenCalledWith('Created subscription testApi.testMethod')
    })

    it('should warn when subscribing non-existent client', () => {
      bus.subscribe('nonexistent', {
        id: 'testApi.testMethod',
        api: 'testApi',
        endpoint: 'testMethod',
      })

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Cannot subscribe: client with id nonexistent not found',
      )
    })

    it('should throw error for invalid subscription ID format', () => {
      const socket = createMockSocket('client1')
      bus.addClient(socket)

      expect(() => {
        bus.subscribe('client1', { id: 'invalid', api: '', endpoint: '' })
      }).toThrow('Invalid API ID in subscription: invalid')
    })

    it('should throw error for non-existent API', () => {
      const socket = createMockSocket('client1')
      bus.addClient(socket)

      expect(() => {
        bus.subscribe('client1', {
          id: 'nonexistent.method',
          api: 'nonexistent',
          endpoint: 'method',
        })
      }).toThrow('API not found: nonexistent')
    })

    it('should throw error for non-existent API method', () => {
      const socket = createMockSocket('client1')
      bus.addClient(socket)

      expect(() => {
        bus.subscribe('client1', {
          id: 'testApi.nonexistent',
          api: 'testApi',
          endpoint: 'nonexistent',
        })
      }).toThrow('API method not found: testApi.nonexistent')
    })

    it('should start polling for poll-mode subscription', async () => {
      const socket = createMockSocket('client1')
      bus.addClient(socket)

      bus.subscribe('client1', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })

      // Should make immediate call
      await vi.runOnlyPendingTimersAsync()

      expect(mockLogger.debug).toHaveBeenCalledWith('Calling subscription testApi.testMethod')
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Started polling for subscription testApi.testMethod every 1000ms',
      )
    })

    it('should set up push producer for push-mode subscription', () => {
      const socket = createMockSocket('client1')
      bus.addClient(socket)

      bus.subscribe('client1', { id: 'pushApi.pushMethod', api: 'pushApi', endpoint: 'pushMethod' })

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Created push producer for subscription pushApi.pushMethod',
      )
    })

    it('should reuse existing subscription for multiple clients', () => {
      const socket1 = createMockSocket('client1')
      const socket2 = createMockSocket('client2')

      bus.addClient(socket1)
      bus.addClient(socket2)

      bus.subscribe('client1', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })
      bus.subscribe('client2', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })

      // Should only create subscription once
      const infoLogs = (mockLogger.info.mock.calls as unknown[][]).filter((call) =>
        (call[0] as string).includes('Created subscription'),
      )
      expect(infoLogs).toHaveLength(1)
    })

    it('should send cached data to new subscriber', async () => {
      const socket1 = createMockSocket('client1')
      const socket2 = createMockSocket('client2')

      bus.addClient(socket1)
      bus.subscribe('client1', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })

      // Wait for initial call to complete and cache data
      await vi.runOnlyPendingTimersAsync()

      // Add second client - should receive cached data
      bus.addClient(socket2)
      bus.subscribe('client2', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(socket2.emit).toHaveBeenCalledWith(WebSocketEvent.API_DATA, expect.any(Object))
    })
  })

  describe('unsubscribe', () => {
    beforeEach(() => {
      const mockApi: APIRegistration = () => ({
        testMethod: async () => Promise.resolve({ data: 'test' }),
      })

      bus.registerApi('testApi', mockApi, 'poll')
    })

    it('should unsubscribe client from subscription', () => {
      const socket = createMockSocket('client1')
      bus.addClient(socket)
      bus.subscribe('client1', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })

      bus.unsubscribe('client1', 'testApi.testMethod')

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Removed subscription testApi.testMethod (no clients)',
      )
    })

    it('should warn when unsubscribing non-existent client', () => {
      bus.unsubscribe('nonexistent', 'testApi.testMethod')

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Cannot unsubscribe: client with id nonexistent not found',
      )
    })

    it('should warn when unsubscribing from non-existent subscription', () => {
      const socket = createMockSocket('client1')
      bus.addClient(socket)

      bus.unsubscribe('client1', 'nonexistent.method')

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Cannot unsubscribe: subscription nonexistent.method not found',
      )
    })

    it('should clear timer when last client unsubscribes', () => {
      const socket = createMockSocket('client1')
      bus.addClient(socket)
      bus.subscribe('client1', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })

      bus.unsubscribe('client1', 'testApi.testMethod')

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Removed subscription testApi.testMethod (no clients)',
      )
    })

    it('should keep subscription when other clients still subscribed', () => {
      const socket1 = createMockSocket('client1')
      const socket2 = createMockSocket('client2')

      bus.addClient(socket1)
      bus.addClient(socket2)
      bus.subscribe('client1', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })
      bus.subscribe('client2', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })

      bus.unsubscribe('client1', 'testApi.testMethod')

      // Subscription should still exist
      const subscriptionInfo = bus.getSubscriptionsInfo()
      expect(subscriptionInfo).toHaveLength(1)
      expect(subscriptionInfo[0]!.clientCount).toBe(1)
    })
  })

  describe('push subscription teardown', () => {
    it('should call push dispose when last client unsubscribes', async () => {
      const dispose = vi.fn()
      const pushApi: APIRegistration = () => ({
        pushMethod: (callback: (data: unknown) => void) => {
          callback({ data: 'pushed' })
          return Promise.resolve(dispose)
        },
      })

      bus.registerApi('pushApi', pushApi, 'push')

      const socket = createMockSocket('client1')
      bus.addClient(socket)
      bus.subscribe('client1', {
        id: 'pushApi.pushMethod',
        api: 'pushApi',
        endpoint: 'pushMethod',
      })

      // Allow the producer's promise to resolve so pushDispose is captured
      await Promise.resolve()
      await Promise.resolve()

      bus.unsubscribe('client1', 'pushApi.pushMethod')

      expect(dispose).toHaveBeenCalledTimes(1)
      expect(bus.getSubscriptionsInfo()).toHaveLength(0)
    })

    it('should call push dispose when last client disconnects', async () => {
      const dispose = vi.fn()
      const pushApi: APIRegistration = () => ({
        pushMethod: (callback: (data: unknown) => void) => {
          callback({ data: 'pushed' })
          return Promise.resolve(dispose)
        },
      })

      bus.registerApi('pushApi', pushApi, 'push')

      const socket = createMockSocket('client1')
      bus.addClient(socket)
      bus.subscribe('client1', {
        id: 'pushApi.pushMethod',
        api: 'pushApi',
        endpoint: 'pushMethod',
      })

      await Promise.resolve()
      await Promise.resolve()

      bus.removeClient('client1')

      expect(dispose).toHaveBeenCalledTimes(1)
      expect(bus.getSubscriptionsInfo()).toHaveLength(0)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Removed subscription pushApi.pushMethod (no clients)',
      )
    })

    it('should keep push producer running while other clients are subscribed', async () => {
      const dispose = vi.fn()
      const pushApi: APIRegistration = () => ({
        pushMethod: (callback: (data: unknown) => void) => {
          callback({ data: 'pushed' })
          return Promise.resolve(dispose)
        },
      })

      bus.registerApi('pushApi', pushApi, 'push')

      const socket1 = createMockSocket('client1')
      const socket2 = createMockSocket('client2')

      bus.addClient(socket1)
      bus.addClient(socket2)
      bus.subscribe('client1', {
        id: 'pushApi.pushMethod',
        api: 'pushApi',
        endpoint: 'pushMethod',
      })
      bus.subscribe('client2', {
        id: 'pushApi.pushMethod',
        api: 'pushApi',
        endpoint: 'pushMethod',
      })

      await Promise.resolve()
      await Promise.resolve()

      bus.unsubscribe('client1', 'pushApi.pushMethod')

      expect(dispose).not.toHaveBeenCalled()
      expect(bus.getSubscriptionsInfo()).toHaveLength(1)

      bus.unsubscribe('client2', 'pushApi.pushMethod')

      expect(dispose).toHaveBeenCalledTimes(1)
      expect(bus.getSubscriptionsInfo()).toHaveLength(0)
    })

    it('should dispose immediately if subscription was removed before producer resolved', async () => {
      const dispose = vi.fn()
      let resolveProducer: ((value: () => void) => void) | undefined
      const pushApi: APIRegistration = () => ({
        pushMethod: (callback: (data: unknown) => void) => {
          callback({ data: 'pushed' })
          return new Promise<() => void>((resolve) => {
            resolveProducer = resolve
          })
        },
      })

      bus.registerApi('pushApi', pushApi, 'push')

      const socket = createMockSocket('client1')
      bus.addClient(socket)
      bus.subscribe('client1', {
        id: 'pushApi.pushMethod',
        api: 'pushApi',
        endpoint: 'pushMethod',
      })

      // Tear the subscription down before the producer resolves its disposer
      bus.unsubscribe('client1', 'pushApi.pushMethod')

      resolveProducer?.(dispose)
      await Promise.resolve()
      await Promise.resolve()

      expect(dispose).toHaveBeenCalledTimes(1)
    })
  })

  describe('getSubscriptionsInfo', () => {
    it('should return empty array when no subscriptions', () => {
      expect(bus.getSubscriptionsInfo()).toEqual([])
    })

    it('should return subscription metadata', async () => {
      const mockApi: APIRegistration = () => ({
        testMethod: async () => Promise.resolve({ data: 'test' }),
      })

      bus.registerApi('testApi', mockApi, 'poll')
      bus.addClient(createMockSocket('client1'))
      bus.subscribe('client1', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })

      // Wait for initial call to cache data
      await vi.runOnlyPendingTimersAsync()

      const info = bus.getSubscriptionsInfo()

      expect(info).toHaveLength(1)
      expect(info[0]!).toEqual({
        id: 'testApi.testMethod',
        clientCount: 1,
        hasCachedData: true,
        hasTimer: true,
      })
    })

    it('should show correct client count for multiple subscribers', () => {
      const mockApi: APIRegistration = () => ({
        testMethod: async () => Promise.resolve({ data: 'test' }),
      })

      bus.registerApi('testApi', mockApi, 'poll')
      bus.addClient(createMockSocket('client1'))
      bus.addClient(createMockSocket('client2'))
      bus.addClient(createMockSocket('client3'))

      bus.subscribe('client1', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })
      bus.subscribe('client2', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })
      bus.subscribe('client3', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })

      const info = bus.getSubscriptionsInfo()

      expect(info[0]!.clientCount).toBe(3)
    })
  })

  describe('error handling', () => {
    it('should handle API call errors gracefully', async () => {
      const mockApi: APIRegistration = () => ({
        failingMethod: async () => Promise.reject(new Error('API Error')),
      })

      bus.registerApi('testApi', mockApi, 'poll')
      bus.addClient(createMockSocket('client1'))
      bus.subscribe('client1', {
        id: 'testApi.failingMethod',
        api: 'testApi',
        endpoint: 'failingMethod',
      })

      // Wait for API call to fail
      await vi.runOnlyPendingTimersAsync()

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          subscriptionId: 'testApi.failingMethod',
        }),
        'Subscription execution error',
      )
    })

    it('should send error message to clients on API failure', async () => {
      const mockApi: APIRegistration = () => ({
        failingMethod: async () => Promise.reject(new Error('API Error')),
      })

      const socket = createMockSocket('client1')

      bus.registerApi('testApi', mockApi, 'poll')
      bus.addClient(socket)
      bus.subscribe('client1', {
        id: 'testApi.failingMethod',
        api: 'testApi',
        endpoint: 'failingMethod',
      })

      // Wait for API call to fail
      await vi.runOnlyPendingTimersAsync()

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(socket.emit).toHaveBeenCalledWith(
        WebSocketEvent.API_ERROR,
        expect.objectContaining({
          id: 'testApi.failingMethod',
          error: expect.objectContaining({
            message: 'API Error',
          }),
        }),
      )
    })
  })

  describe('edge cases', () => {
    it('should handle unsubscribing from non-existent subscription during client removal', () => {
      const socket = createMockSocket('client1')
      bus.addClient(socket)

      // Manually add a subscription to client's subscription list without creating actual subscription
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const clientInfo = (bus as any).clients.get('client1')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      clientInfo.subscriptions.add('fake.subscription')

      // Should not throw error, just skip the non-existent subscription
      expect(() => {
        bus.removeClient('client1')
      }).not.toThrow()

      expect(bus.clientCount()).toBe(0)
    })

    it('should throw error for invalid endpoint format (missing endpoint)', () => {
      const mockApi: APIRegistration = () => ({
        testMethod: async () => Promise.resolve({ data: 'test' }),
      })

      bus.registerApi('testApi', mockApi, 'poll')

      const socket = createMockSocket('client1')
      bus.addClient(socket)

      // Try to subscribe with valid api but empty endpoint
      expect(() => {
        bus.subscribe('client1', { id: 'testApi.', api: 'testApi', endpoint: '' })
      }).toThrow('Invalid endpoint in subscription: testApi.')

      expect(mockLogger.error).toHaveBeenCalledWith('Invalid endpoint in subscription: testApi.')
    })

    it('should handle race condition where subscription is deleted before client is added', () => {
      const mockApi: APIRegistration = () => ({
        testMethod: async () => Promise.resolve({ data: 'test' }),
      })

      bus.registerApi('testApi', mockApi, 'poll')

      const socket = createMockSocket('client1')
      bus.addClient(socket)

      // Access internal subscriptions map to simulate race condition

      const subscriptionsMap = (bus as any).subscriptions as Map<string, unknown>
      const originalGet = subscriptionsMap.get.bind(subscriptionsMap)
      let callCount = 0

      // Spy on the Map's get method
      const getSpy = vi.spyOn(subscriptionsMap, 'get').mockImplementation((key: string) => {
        callCount++
        // First call is during subscription creation check (line 300)
        // Second call is when adding client to subscription (line 342)
        // Return undefined on the second call to simulate deletion
        if (callCount === 2 && key === 'testApi.testMethod') {
          return undefined
        }
        return originalGet(key)
      })

      // Try to subscribe - should warn about non-existent subscription
      bus.subscribe('client1', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Cannot subscribe: subscription testApi.testMethod not found',
      )

      // Restore the spy
      getSpy.mockRestore()
    })
  })

  describe('integration scenarios', () => {
    it('should handle complete client lifecycle', async () => {
      const mockApi: APIRegistration = () => ({
        testMethod: async () => Promise.resolve({ data: 'test' }),
      })

      const socket = createMockSocket('client1')

      // Register API
      bus.registerApi('testApi', mockApi, 'poll')

      // Connect client
      bus.addClient(socket)
      expect(bus.clientCount()).toBe(1)

      // Subscribe
      bus.subscribe('client1', { id: 'testApi.testMethod', api: 'testApi', endpoint: 'testMethod' })
      await vi.runOnlyPendingTimersAsync()

      // Verify subscription
      expect(bus.getSubscriptionsInfo()).toHaveLength(1)

      // Unsubscribe
      bus.unsubscribe('client1', 'testApi.testMethod')

      // Disconnect
      bus.removeClient('client1')
      expect(bus.clientCount()).toBe(0)
    })

    it('should handle multiple APIs and clients', async () => {
      const mockApi1: APIRegistration = () => ({
        method1: async () => Promise.resolve({ data: 'api1' }),
      })
      const mockApi2: APIRegistration = () => ({
        method2: async () => Promise.resolve({ data: 'api2' }),
      })

      bus.registerApi('api1', mockApi1, 'poll')
      bus.registerApi('api2', mockApi2, 'poll')

      const socket1 = createMockSocket('client1')
      const socket2 = createMockSocket('client2')

      bus.addClient(socket1)
      bus.addClient(socket2)

      bus.subscribe('client1', { id: 'api1.method1', api: 'api1', endpoint: 'method1' })
      bus.subscribe('client1', { id: 'api2.method2', api: 'api2', endpoint: 'method2' })
      bus.subscribe('client2', { id: 'api1.method1', api: 'api1', endpoint: 'method1' })

      await vi.runOnlyPendingTimersAsync()

      expect(bus.listApis()).toHaveLength(2)
      expect(bus.clientCount()).toBe(2)
      expect(bus.getSubscriptionsInfo()).toHaveLength(2)
    })
  })
})
