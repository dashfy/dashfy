import * as React from 'react'

import { DEFAULT_ROTATION_DURATION } from '@/constants/dashboardConstants'

export interface DashboardProgressBarProps {
  currentIndex?: number
  rotationDuration?: number
  isPlaying?: boolean
}

export const DashboardProgressBar = ({
  currentIndex = 0,
  rotationDuration = DEFAULT_ROTATION_DURATION,
  isPlaying = false,
}: DashboardProgressBarProps) => {
  const [progress, setProgress] = React.useState(0)
  const startTimeRef = React.useRef<number | null>(null)
  const animationFrameRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    if (!isPlaying) {
      setProgress(0)
      startTimeRef.current = null

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      return
    }

    startTimeRef.current = Date.now()
    setProgress(0)

    const updateProgress = () => {
      if (!startTimeRef.current) {
        return
      }

      const elapsed = Date.now() - startTimeRef.current
      const newProgress = Math.min((elapsed / rotationDuration) * 100, 100)

      setProgress(newProgress)

      if (newProgress < 100) {
        animationFrameRef.current = requestAnimationFrame(updateProgress)
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateProgress)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, rotationDuration, currentIndex])

  if (!isPlaying) {
    return null
  }

  return (
    <div className="absolute left-0 top-0 z-10 h-1 w-full overflow-hidden bg-muted/30">
      <div
        className="h-full bg-primary will-change-[width]"
        style={{
          width: `${progress}%`,
          transition: 'none',
        }}
      />
    </div>
  )
}
