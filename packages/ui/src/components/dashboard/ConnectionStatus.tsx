import { connectionStatusConfig } from '@/config/connectionStatusConfig'
import { cn } from '@/lib/utils'
import { useDashfyStore } from '@/store'

export const ConnectionStatus = () => {
  const status = useDashfyStore((state) => state.status)
  const config = connectionStatusConfig[status]

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={cn('inline-flex h-2 w-2 rounded-full', config.bgColor, {
          'animate-pulse': config.pulse,
        })}
      />
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  )
}
