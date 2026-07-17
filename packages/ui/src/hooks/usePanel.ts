import { useDashfyStore } from '@/store'

/**
 * Hook for managing panel state and functionality.
 *
 * Provides access to the panel open state, height, active tab, and methods
 * for toggling, opening, closing, and setting the panel height and active tab.
 *
 * @returns Object containing:
 * - `isPanelOpen` - Whether the panel is open
 * - `panelHeight` - The current panel height
 * - `activeTab` - The current active tab
 * - `togglePanel` - Function to toggle the panel
 * - `openPanel` - Function to open the panel
 * - `closePanel` - Function to close the panel
 * - `setPanelHeight` - Function to set the panel height
 * - `setActiveTab` - Function to set the active tab
 *
 * @example
 * ```tsx
 * const { isPanelOpen, togglePanel } = usePanel()
 *
 * return (
 *   <div>
 *     <button onClick={togglePanel}>{isPanelOpen ? 'Close' : 'Open'}</button>
 *   </div>
 * )
 * ```
 */
export const usePanel = () => {
  const isPanelOpen = useDashfyStore((state) => state.isPanelOpen)
  const panelHeight = useDashfyStore((state) => state.panelHeight)
  const activeTab = useDashfyStore((state) => state.activeTab)
  const togglePanel = useDashfyStore((state) => state.togglePanel)
  const openPanel = useDashfyStore((state) => state.openPanel)
  const closePanel = useDashfyStore((state) => state.closePanel)
  const setPanelHeight = useDashfyStore((state) => state.setPanelHeight)
  const setActiveTab = useDashfyStore((state) => state.setActiveTab)

  return {
    isPanelOpen,
    panelHeight,
    activeTab,
    togglePanel,
    openPanel,
    closePanel,
    setPanelHeight,
    setActiveTab,
  }
}
