import { LogoIcon } from '@/components/logo/LogoIcon'
import { SettingsButton } from '@/components/settings/SettingsButton'
import { Separator } from '@/components/ui/separator'
import { DEFAULT_DASHBOARD_TITLE, DEFAULT_ROTATION_DURATION } from '@/constants/dashboardConstants'

import { DashboardPlayer } from './DashboardPlayer'
import { DashboardProgressBar } from './DashboardProgressBar'
import { DashboardTitle } from './DashboardTitle'
import { FullscreenButton } from './FullscreenButton'

export interface DashboardHeaderProps {
  title?: string
  dashboardCount?: number
  currentIndex?: number
  isPlaying?: boolean
  rotationDuration?: number
  logo?: React.ReactNode
  onPlay?: () => void
  onPause?: () => void
  onPrevious?: () => void
  onNext?: () => void
  onSettings?: () => void
}

export const DashboardHeader = ({
  title,
  dashboardCount = 1,
  currentIndex = 0,
  isPlaying = false,
  rotationDuration = DEFAULT_ROTATION_DURATION,
  logo,
  onPlay,
  onPause,
  onPrevious,
  onNext,
  onSettings,
}: DashboardHeaderProps) => {
  const showControls = dashboardCount > 1

  return (
    <header className="relative flex h-14 items-center justify-between border-b border-border bg-background pl-0 pr-2">
      <DashboardProgressBar
        currentIndex={currentIndex}
        isPlaying={isPlaying}
        rotationDuration={rotationDuration}
      />

      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-primary">
          {logo ?? <LogoIcon className="text-primary-foreground" size="sm" />}
        </div>
        <DashboardTitle
          currentIndex={currentIndex}
          dashboardCount={dashboardCount}
          isPlaying={isPlaying}
          title={title ?? DEFAULT_DASHBOARD_TITLE}
          onNext={onNext}
          onPause={onPause}
          onPlay={onPlay}
          onPrevious={onPrevious}
        />
      </div>

      <nav aria-label="Dashboard controls" className="flex items-center gap-2">
        {showControls && (
          <div className="hidden items-center md:flex">
            <DashboardPlayer
              isPlaying={isPlaying}
              onNext={onNext}
              onPause={onPause}
              onPlay={onPlay}
              onPrevious={onPrevious}
            />
            <Separator className="mx-2 h-6 w-px bg-border" orientation="vertical" />
          </div>
        )}

        <FullscreenButton />

        <SettingsButton onSettings={onSettings} />
      </nav>
    </header>
  )
}
