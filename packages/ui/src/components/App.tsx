import * as React from 'react'

import { ThemeProvider } from '@/providers/ThemeProvider'

import { Notifications } from './notifications/Notifications'
import { TooltipProvider } from './ui/tooltip'

export interface AppProps {
  children: React.ReactNode
  defaultTheme?: string
}

export const App = ({ children, defaultTheme }: AppProps) => {
  return (
    <ThemeProvider defaultTheme={defaultTheme}>
      <TooltipProvider>
        {children}
        <Notifications />
      </TooltipProvider>
    </ThemeProvider>
  )
}
