import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

import {
  AlertCircleIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  HelpCircleIcon,
} from '@/components/common/Icons'
import { cn } from '@/lib/utils'

const statusVariants = cva(
  'inline-flex flex-col items-center justify-center gap-2 rounded-lg p-6',
  {
    variants: {
      status: {
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
        error: 'bg-error/10 text-error',
        unknown: 'bg-muted text-muted-foreground',
      },
      size: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    defaultVariants: {
      status: 'unknown',
      size: 'md',
    },
  },
)

const iconMap = {
  success: CheckCircle2Icon,
  warning: AlertTriangleIcon,
  error: AlertCircleIcon,
  unknown: HelpCircleIcon,
}

export interface WidgetStatusBadgeProps extends VariantProps<typeof statusVariants> {
  className?: string
  label?: string
}

export const WidgetStatusBadge = ({ className, status, size, label }: WidgetStatusBadgeProps) => {
  const Icon = iconMap[status ?? 'unknown']

  return (
    <div className={cn(statusVariants({ status, size }), className)}>
      <Icon
        className={cn('h-12 w-12', {
          'h-8 w-8': size === 'sm',
          'h-16 w-16': size === 'lg',
        })}
      />
      {label && <span className="text-center text-sm font-medium">{label}</span>}
    </div>
  )
}
