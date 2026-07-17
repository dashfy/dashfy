import { WidgetRegistry } from '@/registry/WidgetRegistry'

/**
 * Hook for retrieving widget components from the global widget registry.
 *
 * Looks up a widget component by extension and widget name, returning the component,
 * its metadata (if available), and whether it exists in the registry. Useful for
 * dynamic widget rendering and validation.
 *
 * @param extension - Extension identifier (e.g., "json", "github")
 * @param widget - Widget name within the extension (e.g., "status", "data")
 *
 * @returns Object containing:
 * - `component` - The widget React component or undefined if not found
 * - `metadata` - Widget metadata (displayName, description, etc.) or undefined
 * - `exists` - Boolean indicating if the widget is registered
 *
 * @example
 * ```tsx
 * function WidgetRenderer({ extension, widget }) {
 *   const { component: Widget, metadata, exists } = useWidget(extension, widget)
 *
 *   if (!exists) {
 *     return <div>Widget not found: {extension}:{widget}</div>
 *   }
 *
 *   return (
 *     <div>
 *       <h3>{metadata?.displayName || widget}</h3>
 *       <Widget />
 *     </div>
 *   )
 * }
 * ```
 */
export function useWidget(extension: string, widget: string) {
  const key = `${extension}:${widget}`
  const component = WidgetRegistry.get(key)
  const entry = WidgetRegistry.getEntry(key)
  const exists = WidgetRegistry.has(key)

  return {
    component,
    metadata: entry?.metadata,
    exists,
  }
}
