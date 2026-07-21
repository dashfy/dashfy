'use client'

import '@getdashfy/ui/styles.css'

import { Dashfy, ThemeRegistry } from '@getdashfy/ui'

ThemeRegistry.loadAllThemes()

export default function DashfyApp() {
  return <Dashfy />
}
