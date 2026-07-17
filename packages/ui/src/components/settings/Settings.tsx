import { Scrollable } from '@/components/common/Scrollable'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

import { DataActions } from './DataActions'
import { ModeSelector } from './ModeSelector'
import { ThemeSelector } from './ThemeSelector'
import { WakeLockSelector } from './WakeLockSelector'

export interface SettingsProps {
  open?: boolean
  onClose: () => void
}

export const Settings = ({ open = false, onClose }: SettingsProps) => {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full p-0 sm:max-w-md">
        <div className="flex h-full flex-col">
          <div className="px-6 pt-6">
            <SheetHeader>
              <SheetTitle className="text-left">Settings</SheetTitle>
              <SheetDescription className="text-left">
                Configure your dashboard preferences.
              </SheetDescription>
            </SheetHeader>
          </div>

          <Scrollable className="flex-1">
            <div className="space-y-6 px-6 pb-6 pt-8">
              <section>
                <ModeSelector />
              </section>

              <Separator />

              <section>
                <ThemeSelector />
              </section>

              <Separator />

              <section>
                <WakeLockSelector />
              </section>

              <Separator />

              <section>
                <DataActions />
              </section>
            </div>
          </Scrollable>
        </div>
      </SheetContent>
    </Sheet>
  )
}
