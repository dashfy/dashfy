import { NotificationType } from '@getdashfy/types'
import * as React from 'react'
import { toast } from 'sonner'

import { Toaster } from '@/components/ui/sonner'
import { useDashfyStore } from '@/store'

export const Notifications = () => {
  const notifications = useDashfyStore((state) => state.notifications)
  const shownIdsRef = React.useRef<Set<string>>(new Set())

  React.useEffect(() => {
    // Toast each notification exactly once. Error notifications default to `ttl: -1` and
    // stay in the store indefinitely, so reacting to the newest entry on every change
    // re-toasts a lingering error whenever a later notification is auto-dismissed.
    for (const notification of notifications) {
      if (shownIdsRef.current.has(notification.id)) {
        continue
      }

      shownIdsRef.current.add(notification.id)

      switch (notification.type) {
        case NotificationType.SUCCESS:
          toast.success(notification.message)
          break
        case NotificationType.ERROR:
          toast.error(notification.message, { closeButton: true })
          break
        case NotificationType.WARNING:
          toast.warning(notification.message, { closeButton: true })
          break
        case NotificationType.INFO:
          toast.info(notification.message)
          break
        default:
          toast(notification.message)
      }
    }

    // Ids are monotonic and never reused, so dropping ids for dismissed notifications
    // keeps the set bounded without risking a repeat toast.
    const currentIds = new Set(notifications.map((notification) => notification.id))

    for (const id of shownIdsRef.current) {
      if (!currentIds.has(id)) {
        shownIdsRef.current.delete(id)
      }
    }
  }, [notifications])

  return <Toaster duration={5_000} expand={false} position="bottom-right" />
}
