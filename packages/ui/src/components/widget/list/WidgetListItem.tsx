import * as React from 'react'

import { cn } from '@/lib/utils'

export interface WidgetListItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: React.ReactNode
  meta?: string
  title: React.ReactNode
  value?: React.ReactNode
}

export const WidgetListItem = ({
  className,
  icon,
  meta,
  title,
  value,
  ...props
}: WidgetListItemProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-border px-4 py-3 transition-colors hover:bg-muted/50',
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{title}</div>
          {meta && <p className="truncate text-xs text-muted-foreground">{meta}</p>}
        </div>
      </div>
      {value && <div className="ml-4 shrink-0 text-right text-sm font-semibold">{value}</div>}
    </div>
  )
}
