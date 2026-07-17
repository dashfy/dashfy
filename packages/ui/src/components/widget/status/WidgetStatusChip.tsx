import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const chipVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
  {
    variants: {
      status: {
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
        info: 'bg-info/10 text-info',
        unknown: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      status: 'unknown',
    },
  },
)

export interface WidgetStatusChipProps extends VariantProps<typeof chipVariants> {
  className?: string
  label: string
  pulse?: boolean
  showDot?: boolean
}

export const WidgetStatusChip = ({
  className,
  status,
  label,
  pulse = false,
  showDot = true,
}: WidgetStatusChipProps) => {
  return (
    <span className={cn(chipVariants({ status }), className)}>
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full bg-current', { 'animate-pulse': pulse })} />
      )}
      {label}
    </span>
  )
}
