import type { Preview } from '@storybook/react-vite'
import * as React from 'react'

import { App } from '../src/components/App'
import '../src/styles.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disabled: true,
    },
  },
  decorators: [
    (Story, context) => {
      const mode = context.globals.theme || 'light'

      React.useEffect(() => {
        // Apply mode to document.documentElement (same as useMode hook)
        const root = document.documentElement
        if (mode === 'dark') {
          root.classList.add('dark')
        } else {
          root.classList.remove('dark')
        }
      }, [mode])

      return (
        <App defaultTheme="default">
          <div className="min-h-screen bg-background p-8">
            <Story />
          </div>
        </App>
      )
    },
  ],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'circlehollow', title: 'Light' },
          { value: 'dark', icon: 'circle', title: 'Dark' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
}

export default preview
