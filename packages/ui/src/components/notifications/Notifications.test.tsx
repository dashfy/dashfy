import { render } from '@testing-library/react'
import { act } from 'react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Notifications } from '@/components/notifications/Notifications'
import { useDashfyStore } from '@/store'

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => null,
}))

describe('Notifications', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    useDashfyStore.getState().clearNotifications()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('toasts each notification exactly once', () => {
    render(<Notifications />)

    act(() => {
      useDashfyStore.getState().notifyInfo('Polling started')
    })

    act(() => {
      useDashfyStore.getState().notifyInfo('Polling stopped')
    })

    expect(toast.info).toHaveBeenCalledTimes(2)
    expect(toast.info).toHaveBeenNthCalledWith(1, 'Polling started')
    expect(toast.info).toHaveBeenNthCalledWith(2, 'Polling stopped')
  })

  it('does not re-toast a lingering error when a newer notification auto-dismisses', () => {
    render(<Notifications />)

    // Errors default to `ttl: -1`, so this entry stays in the store for the whole test.
    act(() => {
      useDashfyStore.getState().notifyError('Disconnected from server')
    })

    act(() => {
      useDashfyStore.getState().notifySuccess('Reconnected to server')
    })

    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.success).toHaveBeenCalledTimes(1)

    // Dropping the success notification once its ttl elapses must not surface the
    // outage error a second time.
    act(() => {
      vi.advanceTimersByTime(2_000)
    })

    expect(useDashfyStore.getState().notifications).toHaveLength(1)
    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.success).toHaveBeenCalledTimes(1)
  })
})
