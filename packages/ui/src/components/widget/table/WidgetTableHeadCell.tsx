import * as React from 'react'

import { cn } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WidgetTableHeadCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export const WidgetTableHeadCell = ({
  align = 'left',
  children,
  className,
  ...props
}: WidgetTableHeadCellProps) => {
  return (
    <th
      align={align}
      className={cn(
        'border-b-2 border-border bg-muted/30 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground',
        {
          'text-left': align === 'left',
          'text-center': align === 'center',
          'text-right': align === 'right',
        },
        className,
      )}
      {...props}
    >
      {children}
    </th>
  )
}
