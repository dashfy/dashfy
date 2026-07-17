import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const textVariants = cva('', {
  variants: {
    variant: {
      default: 'text-base font-normal leading-normal',
      display: 'text-2xl font-semibold leading-tight',
      small: 'text-sm font-normal leading-normal',
      strong: 'text-base font-semibold leading-normal',
      mono: 'font-mono text-sm leading-relaxed',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  as?: 'span' | 'p' | 'div' | 'label' | 'code'
}

export const Text = ({
  children,
  className,
  variant,
  as: Component = 'span',
  ...props
}: TextProps) => {
  return (
    <Component className={cn(textVariants({ variant }), className)} {...props}>
      {children}
    </Component>
  )
}
