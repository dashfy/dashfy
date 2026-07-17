import * as React from 'react'

import { AlertCircleIcon } from '@/components/common/Icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface WidgetErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  error: string | Error
  onRetry?: () => void
}

export const WidgetError = ({ className, error, onRetry, ...props }: WidgetErrorProps) => {
  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <div
      className={cn('flex h-full flex-col items-center justify-center gap-3 p-4', className)}
      {...props}
    >
      <AlertCircleIcon className="h-8 w-8 text-error" />
      <div className="text-center">
        <p className="mb-1 text-sm font-medium text-foreground">Error loading data</p>
        <p className="text-xs text-muted-foreground">{errorMessage}</p>
      </div>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
