import * as React from 'react'

import { cn } from '@/lib/utils'

export interface WidgetCounterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right'
  count: number
  unit?: string
  preLabel?: React.ReactNode
  postLabel?: React.ReactNode
}

export const WidgetCounter = ({
  align = 'center',
  className,
  count,
  unit,
  preLabel,
  postLabel,
  ...props
}: WidgetCounterProps) => {
  const alignmentClass = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }[align]

  return (
    <div
      className={cn('flex h-full w-full flex-col overflow-hidden p-4', alignmentClass, className)}
      {...props}
    >
      {preLabel && <div className="mb-4 text-sm text-muted-foreground">{preLabel}</div>}

      <div className="flex flex-1 items-center justify-center">
        <div className="whitespace-pre">
          <span className="text-5xl font-bold text-foreground">{count.toLocaleString()}</span>
          {unit && (
            <span className="ml-2 text-3xl font-semibold text-muted-foreground">{unit}</span>
          )}
        </div>
      </div>

      {postLabel && <div className="mt-4 text-sm text-muted-foreground">{postLabel}</div>}
    </div>
  )
}
