import * as React from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export interface WidgetLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string
}

export const WidgetLoader = ({
  className,
  message = 'Loading...',
  ...props
}: WidgetLoaderProps) => {
  return (
    <div
      className={cn('flex h-full flex-col items-center justify-center gap-3', className)}
      {...props}
    >
      <Spinner className="h-8 w-8 text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WidgetSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const WidgetSkeleton = ({ className, ...props }: WidgetSkeletonProps) => {
  return (
    <div className={cn('space-y-3', className)} {...props}>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  )
}
