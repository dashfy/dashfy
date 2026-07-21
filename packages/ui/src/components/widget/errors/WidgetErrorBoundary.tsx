import { getErrorMessage } from '@getdashfy/utils'
import * as React from 'react'
import type { FallbackProps } from 'react-error-boundary'
import { ErrorBoundary } from 'react-error-boundary'

import { CircleXIcon } from '@/components/common/Icons'
import { Button } from '@/components/ui/button'

export interface ErrorBoundaryProps {
  children: React.ReactNode
  /**
   * Custom fallback UI to render when error occurs.
   * If not provided, uses the default Dashfy error UI.
   */
  fallback?: React.ReactNode
  /**
   * Keys that when changed will reset the error boundary
   */
  resetKeys?: unknown[]
  /**
   * Callback when an error is caught (useful for logging/analytics)
   */
  onError?: (error: Error, info: React.ErrorInfo) => void
  /**
   * Called when error boundary resets (e.g., after retry)
   */
  onReset?: () => void
}

/**
 * Default fallback component with Dashfy styling
 */
const DefaultFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const errorMessage = getErrorMessage(error)

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
      <CircleXIcon className="h-8 w-8 shrink-0 text-error" />
      <div className="text-center">
        <p className="mb-1 text-sm font-semibold text-error">
          An error occurred while loading data
        </p>
        {errorMessage && <p className="font-mono text-xs text-muted-foreground">{errorMessage}</p>}
      </div>
      <Button className="shrink-0" size="sm" variant="secondary" onClick={resetErrorBoundary}>
        Try again
      </Button>
    </div>
  )
}

/**
 * Error boundary for catching and displaying errors in widgets.
 * Wraps react-error-boundary with Dashfy-specific defaults.
 *
 * @example
 * // Basic usage
 * <WidgetErrorBoundary>
 *   <MyWidget />
 * </WidgetErrorBoundary>
 *
 * @example
 * // With custom fallback
 * <WidgetErrorBoundary fallback={<div>Custom error</div>}>
 *   <MyWidget />
 * </WidgetErrorBoundary>
 *
 * @example
 * // With error logging
 * <WidgetErrorBoundary onError={(error) => logToSentry(error)}>
 *   <MyWidget />
 * </WidgetErrorBoundary>
 */
export const WidgetErrorBoundary = ({
  children,
  fallback,
  onError,
  onReset,
  resetKeys,
}: ErrorBoundaryProps) => {
  const handleError = (error: Error, info: React.ErrorInfo) => {
    console.error('Error caught by WidgetErrorBoundary:', error, info)
    onError?.(error, info)
  }

  return (
    <ErrorBoundary
      FallbackComponent={fallback ? () => <>{fallback}</> : DefaultFallback}
      resetKeys={resetKeys}
      onError={handleError}
      onReset={onReset}
    >
      {children}
    </ErrorBoundary>
  )
}
