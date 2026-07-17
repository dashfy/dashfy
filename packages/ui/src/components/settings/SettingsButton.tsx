import { SettingsIcon } from '@/components/common/Icons'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export interface SettingsButtonProps {
  onSettings?: () => void
}

export const SettingsButton = ({ onSettings }: SettingsButtonProps) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="ghost" onClick={onSettings}>
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Settings (S)</TooltipContent>
    </Tooltip>
  )
}
