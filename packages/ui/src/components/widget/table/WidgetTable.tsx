import * as React from 'react'

import { Scrollable } from '@/components/common/Scrollable'
import { cn } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WidgetTableProps extends React.HTMLAttributes<HTMLTableElement> {}

export const WidgetTable = ({ children, className, ...props }: WidgetTableProps) => {
  return (
    <Scrollable
      className="w-full"
      options={{
        overflow: {
          x: 'scroll',
          y: 'hidden',
        },
      }}
      {...props}
    >
      <table className={cn('w-full border-collapse text-sm', className)}>{children}</table>
    </Scrollable>
  )
}
