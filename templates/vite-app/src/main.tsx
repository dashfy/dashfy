import '@dashfy/ui/styles.css'

import { ThemeRegistry } from '@dashfy/ui'
import * as React from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'

ThemeRegistry.loadAllThemes()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
