import * as React from 'react'

import { cn } from '@/lib/utils'

export interface WidgetLabelProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'label' | 'prefix' | 'suffix'> {
  label: React.ReactNode
  prefix?: React.ReactNode
  suffix?: React.ReactNode
}

export const WidgetLabel = ({ className, label, prefix, suffix, ...props }: WidgetLabelProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-stretch overflow-hidden rounded bg-muted text-sm text-muted-foreground',
        className,
      )}
      {...props}
    >
      {prefix && (
        <span className="inline-flex items-center border-r border-border bg-muted/50 px-2 py-1">
          {prefix}
        </span>
      )}
      <span className="inline-flex flex-grow items-center px-3 py-1 font-medium">{label}</span>
      {suffix && (
        <span className="inline-flex items-center border-l border-border bg-muted/50 px-2 py-1">
          {suffix}
        </span>
      )}
    </span>
  )
}
