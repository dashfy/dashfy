import * as React from 'react'

import { InboxIcon } from '@/components/common/Icons'
import { cn } from '@/lib/utils'

export interface WidgetEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  message?: string
}

export const WidgetEmpty = ({
  className,
  icon,
  message = 'No data available',
  ...props
}: WidgetEmptyProps) => {
  return (
    <div
      className={cn('flex h-full flex-col items-center justify-center gap-3 p-4', className)}
      {...props}
    >
      {icon ?? <InboxIcon className="h-8 w-8 text-muted-foreground" />}
      <p className="text-center text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
