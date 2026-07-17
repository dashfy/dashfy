import * as React from 'react'

import { useDashfyStore } from '@/store'

/**
 * Hook for managing Dashfy configuration state and automatic fetching.
 *
 * Automatically fetches configuration from the server on mount if not already loaded.
 * Provides access to the configuration data, loading state, error state, and a
 * refetch function for manual updates.
 *
 * @returns Object containing:
 * - `config` - The current configuration
 * - `isLoading` - Whether the configuration is loading
 * - `error` - The current error
 * - `refetch` - Function to manually fetch the configuration
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { config, isLoading, error, refetch } = useConfiguration()
 *
 *   if (isLoading) return <div>Loading...</div>
 *   if (error) return <div>Error: {error}</div>
 *   return <div>Port: {config?.port}</div>
 * }
 * ```
 */
export function useConfiguration() {
  const config = useDashfyStore((state) => state.config)
  const isLoading = useDashfyStore((state) => state.isLoading)
  const error = useDashfyStore((state) => state.error)
  const fetchConfig = useDashfyStore((state) => state.fetchConfig)

  React.useEffect(() => {
    if (!config && !isLoading && !error) {
      fetchConfig()
    }
  }, [config, isLoading, error, fetchConfig])

  return {
    config,
    isLoading,
    error,
    refetch: fetchConfig,
  }
}
