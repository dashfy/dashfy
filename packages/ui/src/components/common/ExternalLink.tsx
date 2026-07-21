import * as React from 'react'

import { cn } from '@/lib/utils'

export const ExternalLink = ({
  children,
  className,
  href,
  rel = 'noopener noreferrer',
  target = '_blank',
  ...props
}: React.ComponentProps<'a'>) => {
  return (
    <a
      className={cn('text-primary transition-colors hover:underline', className)}
      href={href}
      rel={rel}
      target={target}
      {...props}
    >
      {children}
    </a>
  )
}
