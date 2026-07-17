import * as React from 'react'

import { cn } from '@/lib/utils'

export interface WidgetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  actions?: React.ReactNode
  count?: number
  icon?: React.ReactNode
  subject?: string
  title?: string
}

export const WidgetHeader = ({
  actions,
  className,
  count,
  icon,
  subject,
  title,
  ...props
}: WidgetHeaderProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2',
        className,
      )}
      {...props}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
        {title && <h3 className="text-sm font-semibold">{title}</h3>}
        {subject && <span className="text-xs font-medium text-muted-foreground">{subject}</span>}
        {count !== undefined && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  )
}
