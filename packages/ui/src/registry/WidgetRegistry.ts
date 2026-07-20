import type { WidgetComponent, WidgetMetadata } from '@getdashfy/types'

export type Extension = Record<string, WidgetComponent>

export interface WidgetRegistryEntry {
  component: WidgetComponent
  metadata?: WidgetMetadata
}

/**
 * Global registry for managing widget components and extensions.
 *
 * Provides a centralized system for registering, retrieving, and managing widget
 * components from different extensions. Widgets are identified by namespaced keys
 * in the format "extension:widget" (e.g., "json:status", "github:issues").
 *
 * Supports:
 * - Individual widget registration with optional metadata
 * - Bulk extension registration with multiple widgets
 * - Widget lookup by key or extension/widget name
 * - Metadata storage for widget configuration and documentation
 *
 * @example
 * ```tsx
 * // Register a single widget
 * WidgetRegistry.register('myExtension:counter', CounterWidget, {
 *   displayName: 'Counter',
 *   description: 'Shows a counter value'
 * })
 *
 * // Register an extension with multiple widgets
 * WidgetRegistry.addExtension('json', {
 *   status: StatusWidget,
 *   data: DataWidget
 * })
 *
 * // Retrieve a widget
 * const widget = WidgetRegistry.get('json:status')
 * ```
 */
class WidgetRegistryClass {
  private widgets = new Map<string, WidgetRegistryEntry>()

  /**
   * Register a single widget component.
   *
   * @param key - Widget key in format "extension:widget"
   * @param component - React component
   * @param metadata - Optional widget metadata
   */
  public register(key: string, component: WidgetComponent, metadata?: WidgetMetadata): void {
    this.widgets.set(key, { component, metadata })
  }

  /**
   * Register an entire extension with multiple widgets.
   *
   * @param extensionId - Extension identifier (e.g. "json", "github")
   * @param widgets - Object mapping widget names to components
   */
  public addExtension(extensionId: string, widgets: Extension): void {
    Object.entries(widgets).forEach(([widgetName, component]) => {
      const key = `${extensionId}:${widgetName}`
      this.register(key, component)
    })
  }

  /**
   * Register multiple extensions at once.
   *
   * @param extensions - Object mapping extension IDs to widget objects
   */
  public addExtensions(extensions: Record<string, Extension>): void {
    Object.entries(extensions).forEach(([extensionId, widgets]) => {
      this.addExtension(extensionId, widgets)
    })
  }

  /**
   * Unregister a widget component.
   *
   * @param key - Widget key in format "extension:widget"
   */
  public unregister(key: string): void {
    this.widgets.delete(key)
  }

  /**
   * Get a widget component by key.
   *
   * @param key - Widget key in format "extension:widget"
   * @returns Widget component or undefined if not found
   */
  public get(key: string): WidgetComponent | undefined {
    return this.widgets.get(key)?.component
  }

  /**
   * Get full registry entry (component + metadata).
   *
   * @param key - Widget key in format "extension:widget"
   * @returns Registry entry or undefined if not found
   */
  public getEntry(key: string): WidgetRegistryEntry | undefined {
    return this.widgets.get(key)
  }

  /**
   * Check if a widget type is registered.
   *
   * @param key - Widget key in format "extension:widget"
   * @returns true if widget is registered
   */
  public has(key: string): boolean {
    return this.widgets.has(key)
  }

  /**
   * Check if a widget exists for extension and widget name.
   *
   * @param extension - Extension identifier
   * @param widget - Widget name
   * @returns true if widget is registered
   */
  public hasWidget(extension: string, widget: string): boolean {
    return this.has(`${extension}:${widget}`)
  }

  /**
   * Get widget component by extension and widget name.
   *
   * @param extension - Extension identifier
   * @param widget - Widget name
   * @returns Widget component or undefined if not found
   */
  public getComponent(extension: string, widget: string): WidgetComponent | undefined {
    return this.get(`${extension}:${widget}`)
  }

  /**
   * Get all registered widget keys.
   *
   * @returns Array of widget keys
   */
  public getTypes(): string[] {
    return Array.from(this.widgets.keys())
  }

  /**
   * Get count of registered widgets.
   *
   * @returns Number of registered widgets
   */
  public widgetsCount(): number {
    return this.widgets.size
  }

  /**
   * Get all registered widgets as an object.
   *
   * @returns Object mapping widget keys to entries
   */
  public list(): Record<string, WidgetRegistryEntry> {
    return Object.fromEntries(this.widgets.entries())
  }

  /**
   * Clear all registered widgets.
   */
  public clear(): void {
    this.widgets.clear()
  }
}

// Export singleton instance
export const WidgetRegistry = new WidgetRegistryClass()
