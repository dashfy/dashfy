import { NotificationType } from '@getdashfy/types'
import * as React from 'react'
import { toast } from 'sonner'

import { Toaster } from '@/components/ui/sonner'
import { useDashfyStore } from '@/store'

export const Notifications = () => {
  const notifications = useDashfyStore((state) => state.notifications)

  React.useEffect(() => {
    if (notifications.length === 0) {
      return
    }

    const latestNotification = notifications[notifications.length - 1]

    if (!latestNotification) {
      return
    }

    switch (latestNotification.type) {
      case NotificationType.SUCCESS:
        toast.success(latestNotification.message)
        break
      case NotificationType.ERROR:
        toast.error(latestNotification.message, { closeButton: true })
        break
      case NotificationType.WARNING:
        toast.warning(latestNotification.message, { closeButton: true })
        break
      case NotificationType.INFO:
        toast.info(latestNotification.message)
        break
      default:
        toast(latestNotification.message)
    }
  }, [notifications])

  return <Toaster duration={5_000} expand={false} position="bottom-right" />
}
