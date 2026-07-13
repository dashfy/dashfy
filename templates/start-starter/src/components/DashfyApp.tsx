import '@dashfy/ui/styles.css'

import { Dashfy, ThemeRegistry } from '@dashfy/ui'

ThemeRegistry.loadAllThemes()

export default function DashfyApp() {
  return <Dashfy />
}
