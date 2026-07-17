import { Logo } from './logo/Logo'

export const SplashScreen = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <div className="relative z-10 flex flex-col items-center space-y-8">
        <div className="flex flex-col items-center space-y-2">
          <Logo aria-label="Dashfy" className="animate-fade-in text-foreground" />
          <p className="animate-fade-in-delay text-sm text-muted-foreground">
            Loading your dashboards...
          </p>
        </div>

        <div className="h-1 w-64 overflow-hidden rounded-full bg-border/50">
          <div className="h-full animate-loading-bar bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/80 to-transparent" />
    </div>
  )
}
