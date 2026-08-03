import type { Socket } from 'socket.io-client'
import type { Mock } from 'vitest'
import { describe, expect, it, vi } from 'vitest'

import { WS_RECONNECT_ATTEMPTS } from '@/constants/wsConstants'

import { cleanupWebSocketHandlers, setupWebSocketHandlers } from './WSHelper'

const createFakeSocket = () => {
  const manager = { on: vi.fn(), off: vi.fn() }
  const socket = { on: vi.fn(), off: vi.fn(), io: manager }

  return {
    socket: socket as unknown as Socket,
    socketOn: socket.on,
    socketOff: socket.off,
    managerOn: manager.on,
    managerOff: manager.off,
  }
}

const eventsFrom = (spy: Mock): string[] => {
  const calls = spy.mock.calls as unknown as [string][]
  return calls.map(([event]) => event)
}

describe('setupWebSocketHandlers', () => {
  it('registers reconnection handlers on the manager rather than the socket', () => {
    const { socket, socketOn, managerOn } = createFakeSocket()
    const onReconnect = vi.fn()
    const onReconnectAttempt = vi.fn()
    const onReconnectError = vi.fn()
    const onReconnectFailed = vi.fn()

    setupWebSocketHandlers(socket, {
      onReconnect,
      onReconnectAttempt,
      onReconnectError,
      onReconnectFailed,
    })

    expect(managerOn).toHaveBeenCalledWith('reconnect', onReconnect)
    expect(managerOn).toHaveBeenCalledWith('reconnect_attempt', onReconnectAttempt)
    expect(managerOn).toHaveBeenCalledWith('reconnect_error', onReconnectError)
    expect(managerOn).toHaveBeenCalledWith('reconnect_failed', onReconnectFailed)

    // Registering these on the socket compiles but silently never fires in v4.
    expect(eventsFrom(socketOn)).not.toContain('reconnect_attempt')
    expect(eventsFrom(socketOn)).not.toContain('reconnect_failed')
  })

  it('registers the error handler on connect_error', () => {
    const { socket, socketOn } = createFakeSocket()
    const onError = vi.fn()

    setupWebSocketHandlers(socket, { onError })

    expect(socketOn).toHaveBeenCalledWith('connect_error', onError)
    expect(eventsFrom(socketOn)).not.toContain('error')
  })

  it('registers only the handlers that were provided', () => {
    const { socket, socketOn, managerOn } = createFakeSocket()

    setupWebSocketHandlers(socket, {})

    expect(socketOn).not.toHaveBeenCalled()
    expect(managerOn).not.toHaveBeenCalled()
  })
})

describe('cleanupWebSocketHandlers', () => {
  it('removes manager listeners as well as socket listeners', () => {
    const { socket, socketOff, managerOff } = createFakeSocket()

    cleanupWebSocketHandlers(socket)

    expect(eventsFrom(managerOff)).toEqual(
      expect.arrayContaining([
        'reconnect',
        'reconnect_attempt',
        'reconnect_error',
        'reconnect_failed',
      ]),
    )
    expect(eventsFrom(socketOff)).toEqual(
      expect.arrayContaining([
        'connect',
        'disconnect',
        'connect_error',
        'configuration',
        'api.data',
        'api.error',
      ]),
    )
  })
})

describe('reconnection settings', () => {
  it('never caps reconnection attempts', () => {
    expect(Number.isFinite(WS_RECONNECT_ATTEMPTS)).toBe(false)
  })
})
