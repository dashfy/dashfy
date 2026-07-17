import { modKey } from '@dashfy/utils'

import { PanelBottomIcon } from '@/components/common/Icons'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { usePanel } from '@/hooks/usePanel'

import { ConnectionStatus } from './ConnectionStatus'

export const DashboardStatusBar = () => {
  const { isPanelOpen, togglePanel } = usePanel()

  return (
    <>
      {/* TODO: This is a temporary solution that adds space between
      the dashboard and the status bar on mobile devices. */}
      <div className="block h-2 w-full bg-transparent lg:hidden" />

      <div className="fixed bottom-0 left-0 right-0 z-40 h-9 border-t border-border bg-background px-2">
        <div className="flex h-full items-center justify-between">
          <ConnectionStatus />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="h-6 w-4 [&_svg]:size-3.5"
                variant={isPanelOpen ? 'secondary' : 'ghost'}
                onClick={togglePanel}
              >
                <PanelBottomIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Panel ({modKey}+P)</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  )
}
