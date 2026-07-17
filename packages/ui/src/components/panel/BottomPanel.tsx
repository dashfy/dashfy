import * as React from 'react'
import { Pane, SplitPane } from 'react-split-pane'

import { XIcon } from '@/components/common/Icons'
import { Scrollable } from '@/components/common/Scrollable'
import { usePanel } from '@/hooks/usePanel'
import { cn, generateReactKey } from '@/lib/utils'
import {
  getPanelHeightForViewport,
  MAX_PANEL_HEIGHT,
  MIN_PANEL_HEIGHT,
} from '@/store/slices/panelSlice'

interface PanelDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** SplitPane internal props - destructure to avoid passing to DOM */
  isDragging?: boolean
  currentSize?: number
  minSize?: number
  maxSize?: number
}

const PanelDivider = ({
  isDragging: _isDragging,
  currentSize: _currentSize,
  minSize: _minSize,
  maxSize: _maxSize,
  ...props
}: PanelDividerProps) => {
  return (
    <div
      {...props}
      className={cn(
        'group flex h-1.5 cursor-ns-resize touch-none items-center justify-center border-t border-border bg-background hover:bg-primary/20 active:bg-primary/30',
        props.className,
      )}
      style={{ ...props.style, pointerEvents: 'auto', touchAction: 'none' }}
    >
      <div className="h-1 w-12 rounded-full bg-border transition-colors group-hover:bg-primary/50 group-active:bg-primary" />
    </div>
  )
}

export interface BottomPanelProps {
  children?: React.ReactNode
  tabs?: {
    id: string
    label: string
    icon?: React.ReactNode
    content: React.ReactNode
  }[]
}

export const BottomPanel = ({ children, tabs = [] }: BottomPanelProps) => {
  const { isPanelOpen, panelHeight, activeTab, closePanel, setPanelHeight, setActiveTab } =
    usePanel()

  React.useEffect(() => {
    let wasLandscape = window.innerWidth > window.innerHeight

    const handleResize = () => {
      const isLandscape = window.innerWidth > window.innerHeight

      if (isLandscape !== wasLandscape) {
        wasLandscape = isLandscape
        setPanelHeight(getPanelHeightForViewport())
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [setPanelHeight])

  const handleResizeEnd = React.useCallback(
    (sizes: number[]) => {
      if (sizes[1] !== undefined) {
        setPanelHeight(sizes[1])
      }
    },
    [setPanelHeight],
  )

  const activeTabContent =
    tabs.find((tab) => tab.id === activeTab)?.content ?? tabs[0]?.content ?? children

  return (
    <div
      className={cn(
        'fixed inset-0 transition-all duration-300 ease-in-out',
        isPanelOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
      )}
      style={{ pointerEvents: 'none' }}
    >
      <SplitPane direction="vertical" divider={PanelDivider} onResizeEnd={handleResizeEnd}>
        <Pane>
          <div style={{ pointerEvents: 'none' }} />
        </Pane>
        <Pane defaultSize={panelHeight} maxSize={MAX_PANEL_HEIGHT} minSize={MIN_PANEL_HEIGHT}>
          <div className="flex h-full flex-col bg-background" style={{ pointerEvents: 'auto' }}>
            <div className="flex h-9 items-center justify-between border-b border-border bg-muted/30 px-2">
              <div className="flex items-center gap-1">
                {tabs.map((tab) => (
                  <button
                    key={generateReactKey('tab', tab.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium transition-colors',
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.icon && <span className="flex items-center">{tab.icon}</span>}
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  aria-label="Close panel"
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                  type="button"
                  onClick={closePanel}
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <Scrollable className="min-h-0 flex-1">{activeTabContent}</Scrollable>
          </div>
        </Pane>
      </SplitPane>
    </div>
  )
}
