import * as React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export interface WidgetAvatarProps {
  children?: React.ReactNode
  className?: string
  size?: number | string
  src?: string
  alt?: string
}

export const WidgetAvatar = ({ children, className, size = 36, src, alt }: WidgetAvatarProps) => {
  const sizeValue = typeof size === 'number' ? `${size}px` : size
  const fontSize = typeof size === 'number' ? `${size / 2}px` : `calc(${size} / 2)`

  return (
    <Avatar
      className={className}
      style={{
        width: sizeValue,
        height: sizeValue,
        fontSize,
      }}
    >
      {src && <AvatarImage alt={alt ?? 'Avatar'} src={src} />}
      <AvatarFallback className="bg-muted">{children}</AvatarFallback>
    </Avatar>
  )
}
