/**
 * Creates a debounced function that delays invoking `func` until after `wait` milliseconds.
 *
 * @template T - The type of the function to debounce
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay execution
 * @returns A new debounced version of the provided function
 *
 * @example
 * ```ts
 * // Debounce a search function
 * const debouncedSearch = debounce((query: string) => {
 *   fetchSearchResults(query)
 * }, 300)
 *
 * // User types "hello"
 * debouncedSearch('h')    // Waits...
 * debouncedSearch('he')   // Cancels previous, waits...
 * debouncedSearch('hel')  // Cancels previous, waits...
 * // After 300ms of no calls, executes with 'hel'
 * ```
 *
 * @example
 * ```ts
 * // Debounce window resize handler
 * const debouncedResize = debounce(() => {
 *   recalculateLayout()
 * }, 150)
 *
 * window.addEventListener('resize', debouncedResize)
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout !== null) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(later, wait)
  }
}
