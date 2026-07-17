import * as React from 'react'

import { Scrollable } from '@/components/common/Scrollable'
import { cn } from '@/lib/utils'

export interface WidgetBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  disablePadding?: boolean
  scrollable?: boolean
}

export const WidgetBody = ({
  children,
  className,
  disablePadding = false,
  scrollable = false,
  ...props
}: WidgetBodyProps) => {
  if (scrollable) {
    return (
      <Scrollable
        className={cn('relative flex-1', className, {
          'p-4': !disablePadding,
        })}
        {...props}
      >
        {children}
      </Scrollable>
    )
  }

  return (
    <div
      className={cn('relative flex-1', className, {
        'p-4': !disablePadding,
      })}
      {...props}
    >
      {children}
    </div>
  )
}
