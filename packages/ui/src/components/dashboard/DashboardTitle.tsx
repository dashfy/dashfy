import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

import { DashboardPlayer } from './DashboardPlayer'

export interface DashboardTitleProps {
  currentIndex?: number
  dashboardCount?: number
  title: string
  isPlaying?: boolean
  onPlay?: () => void
  onPause?: () => void
  onPrevious?: () => void
  onNext?: () => void
}

export const DashboardTitle = ({
  currentIndex,
  dashboardCount,
  title,
  isPlaying = false,
  onPlay,
  onPause,
  onPrevious,
  onNext,
}: DashboardTitleProps) => {
  const showCounter = dashboardCount !== undefined && dashboardCount > 1

  return (
    <div className="flex items-center gap-3">
      {/* Mobile: clickable title with popover */}
      <div className="md:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-3">
              <span className="max-w-[150px] truncate text-left text-xl font-bold">{title}</span>
              {showCounter && (
                <span className="text-sm text-muted-foreground">
                  {(currentIndex ?? 0) + 1} / {dashboardCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-2">
            <div className="flex items-center gap-1">
              <DashboardPlayer
                isPlaying={isPlaying}
                showTooltips={false}
                onNext={onNext}
                onPause={onPause}
                onPlay={onPlay}
                onPrevious={onPrevious}
              />
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Desktop: static title */}
      <span className="hidden truncate text-xl font-bold md:block">{title}</span>

      {showCounter && (
        <span className="hidden text-sm text-muted-foreground md:block">
          {(currentIndex ?? 0) + 1} / {dashboardCount}
        </span>
      )}
    </div>
  )
}
