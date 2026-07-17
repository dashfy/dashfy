import { ChevronLeftIcon, ChevronRightIcon, PauseIcon, PlayIcon } from '@/components/common/Icons'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export interface DashboardPlayerProps {
  isPlaying?: boolean
  showTooltips?: boolean
  onPlay?: () => void
  onPause?: () => void
  onPrevious?: () => void
  onNext?: () => void
}

export const DashboardPlayer = ({
  isPlaying = false,
  showTooltips = true,
  onPlay,
  onPause,
  onPrevious,
  onNext,
}: DashboardPlayerProps) => {
  const PreviousButton = (
    <Button size="icon" variant="ghost" onClick={onPrevious}>
      <ChevronLeftIcon className="h-4 w-4" />
    </Button>
  )

  const PlayPauseButton = (
    <Button
      size="icon"
      variant={isPlaying ? 'secondary' : 'ghost'}
      onClick={isPlaying ? onPause : onPlay}
    >
      {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
    </Button>
  )

  const NextButton = (
    <Button size="icon" variant="ghost" onClick={onNext}>
      <ChevronRightIcon className="h-4 w-4" />
    </Button>
  )

  if (!showTooltips) {
    return (
      <div className="flex items-center gap-2">
        {PreviousButton}
        {PlayPauseButton}
        {NextButton}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>{PreviousButton}</TooltipTrigger>
        <TooltipContent>Previous Dashboard (Left Arrow)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>{PlayPauseButton}</TooltipTrigger>
        <TooltipContent>
          {isPlaying ? 'Pause Rotation (Space)' : 'Start Rotation (Space)'}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>{NextButton}</TooltipTrigger>
        <TooltipContent>Next Dashboard (Right Arrow)</TooltipContent>
      </Tooltip>
    </div>
  )
}
