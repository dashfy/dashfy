import * as React from 'react'

import { cn } from '@/lib/utils'

export interface ExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string
}

export const ExternalLink = ({ children, className, href, ...props }: ExternalLinkProps) => {
  return (
    <a
      className={cn('text-primary transition-colors hover:underline', className)}
      href={href}
      rel="noopener noreferrer"
      target="_blank"
      {...props}
    >
      {children}
    </a>
  )
}
