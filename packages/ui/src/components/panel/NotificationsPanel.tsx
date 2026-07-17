import { format } from '@dashfy/utils'
import * as React from 'react'

import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
  TrashIcon,
  XCircleIcon,
} from '@/components/common/Icons'
import { Scrollable } from '@/components/common/Scrollable'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/hooks/useNotifications'
import { cn, generateReactKey } from '@/lib/utils'

export const NotificationsPanel = () => {
  const { notifications, removeNotification, clearNotifications } = useNotifications()

  const sortedNotifications = React.useMemo(() => {
    return [...notifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [notifications])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2Icon className="h-4 w-4 text-success" />
      case 'error':
        return <XCircleIcon className="h-4 w-4 text-error" />
      case 'warning':
        return <AlertCircleIcon className="h-4 w-4 text-warning" />
      case 'info':
      default:
        return <InfoIcon className="h-4 w-4 text-info" />
    }
  }

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-success/20 bg-success/5'
      case 'error':
        return 'border-error/20 bg-error/5'
      case 'warning':
        return 'border-warning/20 bg-warning/5'
      case 'info':
      default:
        return 'border-info/20 bg-info/5'
    }
  }

  return (
    <Scrollable className="h-full">
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </p>
          </div>
          {notifications.length > 0 && (
            <Button
              className="text-xs text-muted-foreground hover:text-foreground"
              size="sm"
              variant="ghost"
              onClick={clearNotifications}
            >
              <TrashIcon className="mr-1 h-3 w-3" />
              Clear All
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border">
            <div className="text-center">
              <InfoIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">No notifications</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedNotifications.map((notification) => (
              <div
                key={generateReactKey('notification', notification.id)}
                className={cn(
                  'group relative rounded-lg border p-3 transition-colors hover:border-border',
                  getNotificationStyles(notification.type),
                )}
              >
                <div className="flex gap-3">
                  <div className="shrink-0 pt-0.5">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm text-foreground">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(notification.createdAt), 'relative')}
                    </p>
                  </div>
                  <button
                    aria-label="Remove notification"
                    className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    type="button"
                    onClick={() => removeNotification(notification.id)}
                  >
                    <XCircleIcon className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Scrollable>
  )
}
