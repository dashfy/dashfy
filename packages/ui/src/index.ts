import { Inspector } from './components/ext/Inspector'
import type { WidgetRegistryEntry } from './registry/WidgetRegistry'
import { WidgetRegistry } from './registry/WidgetRegistry'

WidgetRegistry.addExtension('dashfy', {
  Inspector,
})

export { WidgetRegistry }
export type { WidgetRegistryEntry }

export * from './components/common/DebugInfo'
export * from './components/common/ExternalLink'
export * from './components/common/Scrollable'
export * from './components/common/Text'
export * from './components/Dashfy'
export * from './components/widget/base/Widget'
export * from './components/widget/base/WidgetBody'
export * from './components/widget/base/WidgetEmpty'
export * from './components/widget/base/WidgetError'
export * from './components/widget/base/WidgetHeader'
export * from './components/widget/base/WidgetLoader'
export * from './components/widget/base/WidgetWrapper'
export * from './components/widget/display/WidgetAvatar'
export * from './components/widget/display/WidgetCounter'
export * from './components/widget/display/WidgetLabel'
export * from './components/widget/errors/WidgetErrorBoundary'
export * from './components/widget/errors/WidgetErrorUnknown'
export * from './components/widget/list/WidgetListItem'
export * from './components/widget/status/WidgetStatusBadge'
export * from './components/widget/status/WidgetStatusChip'
export * from './components/widget/table/WidgetTable'
export * from './components/widget/table/WidgetTableCell'
export * from './components/widget/table/WidgetTableHeadCell'
export * from './hooks/useApiSubscription'
export * from './hooks/useMode'
export * from './hooks/useWebSocket'
export * from './hooks/useWidget'
export * from './lib/utils'
export * from './registry/ThemeRegistry'
export * from './store'
