import { MoonIcon, SunIcon } from '@/components/common/Icons'
import { Switch } from '@/components/ui/switch'
import { useMode } from '@/hooks/useMode'

/**
 * Toggle between light and dark theme modes
 */
export const ModeSelector = () => {
  const { toggleMode, isDark } = useMode()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="text-sm font-medium">Appearance</span>
          <p className="text-xs text-muted-foreground">Toggle between light and dark themes</p>
        </div>
        <div className="flex items-center gap-2">
          <SunIcon className="h-4 w-4 text-muted-foreground" />
          <Switch checked={isDark} onCheckedChange={toggleMode} />
          <MoonIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  )
}
