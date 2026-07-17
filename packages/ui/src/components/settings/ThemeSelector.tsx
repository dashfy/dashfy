import { CheckIcon } from '@/components/common/Icons'
import { useMode } from '@/hooks/useMode'
import { useTheme } from '@/hooks/useTheme'
import { cn, generateReactKey } from '@/lib/utils'
import { ThemeRegistry } from '@/registry/ThemeRegistry'

export const ThemeSelector = () => {
  const { currentTheme, availableThemes, setTheme } = useTheme()
  const { isLight } = useMode()

  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <span className="text-sm font-medium">Color Theme</span>
        <p className="text-xs text-muted-foreground">Select your preferred color scheme</p>
      </div>

      <div className="grid gap-3">
        {availableThemes.map((themeId) => {
          const theme = ThemeRegistry.get(themeId)

          if (!theme) {
            return null
          }

          const isSelected = currentTheme === themeId

          return (
            <button
              key={generateReactKey('theme', themeId)}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-lg border-2 p-3 text-left transition-all',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-accent',
              )}
              type="button"
              onClick={() => setTheme(themeId)}
            >
              {/* Color palette preview - Show current mode only */}
              <div className="flex flex-col gap-1">
                {isLight ? (
                  <>
                    {/* Light mode colors */}
                    <div
                      className="h-10 w-14 rounded border border-border/50 shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${theme.light.colors.primary} 0%, ${theme.light.colors.accent} 100%)`,
                      }}
                      title="Light mode"
                    />
                    <div className="flex items-center justify-center gap-0.5">
                      <div
                        className="h-3 w-3 rounded-sm border border-border"
                        style={{ backgroundColor: theme.light.colors.background }}
                        title="Background"
                      />
                      <div
                        className="h-3 w-3 rounded-sm border border-border"
                        style={{ backgroundColor: theme.light.colors.foreground }}
                        title="Foreground"
                      />
                      <div
                        className="h-3 w-3 rounded-sm border border-border"
                        style={{ backgroundColor: theme.light.colors.primary }}
                        title="Primary"
                      />
                      <div
                        className="h-3 w-3 rounded-sm border border-border"
                        style={{ backgroundColor: theme.light.colors.secondary }}
                        title="Secondary"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    {/* Dark mode colors */}
                    <div
                      className="h-10 w-14 rounded border border-border/50 shadow-sm"
                      style={{
                        background: `linear-gradient(135deg, ${theme.dark.colors.primary} 0%, ${theme.dark.colors.accent} 100%)`,
                      }}
                      title="Dark mode"
                    />
                    <div className="flex items-center justify-center gap-0.5">
                      <div
                        className="h-3 w-3 rounded-sm border border-border"
                        style={{ backgroundColor: theme.dark.colors.background }}
                        title="Background"
                      />
                      <div
                        className="h-3 w-3 rounded-sm border border-border"
                        style={{ backgroundColor: theme.dark.colors.foreground }}
                        title="Foreground"
                      />
                      <div
                        className="h-3 w-3 rounded-sm border border-border"
                        style={{ backgroundColor: theme.dark.colors.primary }}
                        title="Primary"
                      />
                      <div
                        className="h-3 w-3 rounded-sm border border-border"
                        style={{ backgroundColor: theme.dark.colors.secondary }}
                        title="Secondary"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Theme info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{theme.displayName}</span>
                  {isSelected && <CheckIcon className="h-4 w-4 text-primary" />}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
