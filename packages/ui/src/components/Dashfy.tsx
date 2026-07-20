import type { DashfyConfig } from '@getdashfy/types'
import * as React from 'react'

import { BellIcon, TerminalIcon, WifiIcon } from '@/components/common/Icons'
import { Scrollable } from '@/components/common/Scrollable'
import {
  DEFAULT_AUTO_PLAY,
  DEFAULT_DASHBOARD_TITLE,
  DEFAULT_ROTATION_DURATION,
} from '@/constants/dashboardConstants'
import { DEFAULT_SERVER_URL } from '@/constants/wsConstants'
import { useDashboardPlayer } from '@/hooks/useDashboardPlayer'
import { useDashboards } from '@/hooks/useDashboards'
import { useDashboardShortcuts } from '@/hooks/useDashboardShortcuts'
import { useFullscreen } from '@/hooks/useFullscreen'
import { usePanel } from '@/hooks/usePanel'
import { useWebSocket } from '@/hooks/useWebSocket'
import { generateReactKey } from '@/lib/utils'
import { WidgetRegistry } from '@/registry/WidgetRegistry'
import { useDashfyStore } from '@/store'

import { App } from './App'
import { Dashboard } from './dashboard/Dashboard'
import { DashboardHeader } from './dashboard/DashboardHeader'
import { DashboardStatusBar } from './dashboard/DashboardStatusBar'
import { BottomPanel } from './panel/BottomPanel'
import { ConnectionPanel } from './panel/ConnectionPanel'
import { ConsolePanel } from './panel/ConsolePanel'
import { NotificationsPanel } from './panel/NotificationsPanel'
import { Settings } from './settings/Settings'
import { SplashScreen } from './SplashScreen'
import { WidgetErrorUnknown } from './widget/errors/WidgetErrorUnknown'

export interface DashfyProps {
  children?: (dashboard: DashfyConfig['dashboards'][0]) => React.ReactNode
  config?: DashfyConfig
  logo?: React.ReactNode
  serverUrl?: string
}

export const Dashfy = ({ children, config, logo, serverUrl = DEFAULT_SERVER_URL }: DashfyProps) => {
  const [openSettings, setOpenSettings] = React.useState(false)

  const setConfig = useDashfyStore((state) => state.setConfig)
  const setDashboards = useDashfyStore((state) => state.setDashboards)
  const storedConfig = useDashfyStore((state) => state.config)

  const {
    current,
    currentDashboard,
    dashboards,
    play,
    pause,
    previousDashboard,
    nextDashboard,
    isPlaying,
    togglePlay,
  } = useDashboards()

  const { toggleFullscreen } = useFullscreen()
  const { togglePanel } = usePanel()

  // Initialize WebSocket
  useWebSocket({ url: serverUrl, autoConnect: true })

  // Keyboard shortcuts
  useDashboardShortcuts({
    onTogglePlay: togglePlay,
    onPrevious: dashboards.length > 1 ? previousDashboard : undefined,
    onNext: dashboards.length > 1 ? nextDashboard : undefined,
    onFullscreen: toggleFullscreen,
    onSettings: () => setOpenSettings(!openSettings),
    onTogglePanel: togglePanel,
  })

  // Set initial config
  React.useEffect(() => {
    if (config) {
      setConfig(config)
      setDashboards(config.dashboards)
    }
  }, [config, setConfig, setDashboards])

  const activeConfig = storedConfig ?? config

  // Initialize dashboard player (after activeConfig is set)
  useDashboardPlayer({
    rotationDuration: activeConfig?.rotationDuration ?? DEFAULT_ROTATION_DURATION,
    autoPlay: DEFAULT_AUTO_PLAY,
  })

  if (!activeConfig || !current) {
    return (
      <App>
        <SplashScreen />
      </App>
    )
  }

  const renderWidgets = () => {
    if (children) {
      return children(current)
    }

    // Default widget rendering - responsive on mobile/tablet, configured on desktop
    return current.widgets.map((widgetConfig, index) => {
      const WidgetComponent = WidgetRegistry.get(`${widgetConfig.extension}:${widgetConfig.widget}`)

      if (!WidgetComponent) {
        return (
          <div
            key={generateReactKey('widget', index)}
            className="min-h-[300px] lg:min-h-0 lg:[grid-column:var(--grid-col)] lg:[grid-row:var(--grid-row)]"
            style={{
              // @ts-expect-error - CSS custom properties for desktop positioning
              '--grid-col': `${widgetConfig.x + 1} / span ${widgetConfig.columns}`,
              '--grid-row': `${widgetConfig.y + 1} / span ${widgetConfig.rows}`,
            }}
          >
            <WidgetErrorUnknown extension={widgetConfig.extension} widget={widgetConfig.widget} />
          </div>
        )
      }

      return (
        <div
          key={generateReactKey('widget', index)}
          className="min-h-[300px] lg:min-h-0 lg:[grid-column:var(--grid-col)] lg:[grid-row:var(--grid-row)]"
          style={{
            // @ts-expect-error - CSS custom properties for desktop positioning
            '--grid-col': `${widgetConfig.x + 1} / span ${widgetConfig.columns}`,
            '--grid-row': `${widgetConfig.y + 1} / span ${widgetConfig.rows}`,
          }}
        >
          <WidgetComponent {...widgetConfig} />
        </div>
      )
    })
  }

  return (
    <App defaultTheme={activeConfig.theme}>
      <div className="relative flex h-screen flex-col">
        <DashboardHeader
          currentIndex={currentDashboard}
          dashboardCount={dashboards.length}
          isPlaying={isPlaying}
          logo={logo}
          rotationDuration={activeConfig?.rotationDuration}
          title={current.title ?? current.name ?? DEFAULT_DASHBOARD_TITLE}
          onNext={nextDashboard}
          onPause={pause}
          onPlay={play}
          onPrevious={previousDashboard}
          onSettings={() => setOpenSettings(true)}
        />

        <div className="flex flex-1 flex-col overflow-hidden pb-9">
          <Scrollable className="flex-1">
            <Dashboard dashboard={current}>{renderWidgets()}</Dashboard>
          </Scrollable>

          <DashboardStatusBar />

          <BottomPanel
            tabs={[
              {
                id: 'connection',
                label: 'Connection',
                icon: <WifiIcon className="h-3.5 w-3.5" />,
                content: <ConnectionPanel />,
              },
              {
                id: 'console',
                label: 'Console',
                icon: <TerminalIcon className="h-3.5 w-3.5" />,
                content: <ConsolePanel />,
              },
              {
                id: 'notifications',
                label: 'Notifications',
                icon: <BellIcon className="h-3.5 w-3.5" />,
                content: <NotificationsPanel />,
              },
            ]}
          />
        </div>

        <Settings open={openSettings} onClose={() => setOpenSettings(false)} />
      </div>
    </App>
  )
}
