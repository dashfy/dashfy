import { WebSocketStatus } from '@getdashfy/types'

import { RefreshCwIcon } from '@/components/common/Icons'
import { Scrollable } from '@/components/common/Scrollable'
import { Button } from '@/components/ui/button'
import { connectionStatusConfig } from '@/config/connectionStatusConfig'
import { cn } from '@/lib/utils'
import { useDashfyStore } from '@/store'

export const ConnectionPanel = () => {
  const status = useDashfyStore((state) => state.status)
  const config = useDashfyStore((state) => state.config)

  const currentStatus = connectionStatusConfig[status]

  return (
    <Scrollable className="h-full">
      <div className="p-4">
        <div className="space-y-6">
          {/* Connection Status Card */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start gap-4">
              <div className={cn('shrink-0', currentStatus.iconColor)}>{currentStatus.icon}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{currentStatus.label}</h3>
                  <span
                    className={cn('inline-flex h-2 w-2 rounded-full', currentStatus.bgColor, {
                      'animate-pulse': currentStatus.pulse,
                    })}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{currentStatus.description}</p>
              </div>
            </div>
          </div>

          {/* Connection Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Details
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                <span className="text-xs text-muted-foreground">Status</span>
                <span className="text-xs font-medium text-foreground">{status}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                <span className="text-xs text-muted-foreground">Protocol</span>
                <span className="text-xs font-medium text-foreground">WebSocket</span>
              </div>
              {config && (
                <div className="flex items-center justify-between rounded-md bg-muted/50 p-2">
                  <span className="text-xs text-muted-foreground">Dashboards</span>
                  <span className="text-xs font-medium text-foreground">
                    {config.dashboards.length}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {status !== WebSocketStatus.CONNECTED && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </h4>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => window.location.reload()}>
                  <RefreshCwIcon className="h-3 w-3" />
                  Reconnect
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Scrollable>
  )
}
