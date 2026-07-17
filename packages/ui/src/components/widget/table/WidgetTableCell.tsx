import * as React from 'react'

import { cn } from '@/lib/utils'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WidgetTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export const WidgetTableCell = ({
  align = 'left',
  children,
  className,
  ...props
}: WidgetTableCellProps) => {
  return (
    <td
      align={align}
      className={cn(
        'border-b border-border px-4 py-3',
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
    </td>
  )
}
