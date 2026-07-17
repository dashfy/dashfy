import * as React from 'react'

import { cn } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WidgetProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Widget = ({ children, className, ...props }: WidgetProps) => {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-all',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
