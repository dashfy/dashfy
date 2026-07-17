import * as React from 'react'
import { useWakeLock } from 'react-screen-wake-lock'

import { MonitorIcon } from '@/components/common/Icons'
import { Switch } from '@/components/ui/switch'
import { useSettings } from '@/hooks/useSettings'

export const WakeLockSelector = () => {
  const { wakeLockEnabled, setWakeLockEnabled } = useSettings()
  const { isSupported, released, request, release } = useWakeLock({
    reacquireOnPageVisible: true,
  })

  const isActive = released === false

  React.useEffect(() => {
    if (!isSupported) {
      return
    }

    const syncWakeLock = async () => {
      if (wakeLockEnabled && released !== false) {
        await request()
      } else if (!wakeLockEnabled && released === false) {
        await release()
      }
    }

    syncWakeLock().catch((error) => {
      console.error('Failed to sync wake lock:', error)
    })
  }, [wakeLockEnabled, isSupported, released, request, release])

  const handleToggle = async (checked: boolean) => {
    setWakeLockEnabled(checked)

    if (checked) {
      await request()
    } else {
      await release()
    }
  }

  if (!isSupported) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-sm font-medium">Keep Screen Awake</span>
            <p className="text-xs text-muted-foreground">Not supported by your browser</p>
          </div>
          <div className="flex items-center gap-2">
            <MonitorIcon className="h-4 w-4 text-muted-foreground" />
            <Switch checked={false} disabled />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-sm font-medium">Keep Screen Awake</span>
          <p className="text-xs text-muted-foreground">Prevent screen from dimming or locking</p>
        </div>
        <div className="flex items-center gap-2">
          <MonitorIcon className="h-4 w-4 text-muted-foreground" />
          <Switch checked={isActive} onCheckedChange={handleToggle} />
        </div>
      </div>
    </div>
  )
}
