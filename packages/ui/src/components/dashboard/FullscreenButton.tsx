import { MaximizeIcon, MinimizeIcon } from '@/components/common/Icons'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useFullscreen } from '@/hooks/useFullscreen'

export interface FullscreenButtonProps {
  targetId?: string
}

export const FullscreenButton = ({ targetId }: FullscreenButtonProps) => {
  const { isFullscreen, toggleFullscreen } = useFullscreen({ targetId })

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="ghost" onClick={toggleFullscreen}>
          {isFullscreen ? (
            <MinimizeIcon className="h-4 w-4" />
          ) : (
            <MaximizeIcon className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}</TooltipContent>
    </Tooltip>
  )
}
