import * as React from 'react'

import { Widget } from './Widget'
import { WidgetBody } from './WidgetBody'
import { WidgetEmpty } from './WidgetEmpty'
import { WidgetError } from './WidgetError'
import { WidgetHeader } from './WidgetHeader'
import { WidgetLoader } from './WidgetLoader'

export interface WidgetWrapperProps {
  actions?: React.ReactNode
  children: (data: unknown) => React.ReactNode
  count?: number
  data?: unknown
  emptyMessage?: string
  error?: string | Error | null
  icon?: React.ReactNode
  subject?: string
  title?: string
  disablePadding?: boolean
  loading?: boolean
  scrollable?: boolean
}

export const WidgetWrapper = ({
  actions,
  children,
  count,
  data,
  emptyMessage = 'No data available',
  error = null,
  icon,
  subject,
  title,
  disablePadding = false,
  loading = false,
  scrollable = false,
}: WidgetWrapperProps) => {
  const renderContent = (): React.ReactNode => {
    if (loading) {
      return <WidgetLoader />
    }

    if (error) {
      return <WidgetError error={error} />
    }

    if (!data) {
      return <WidgetEmpty message={emptyMessage} />
    }

    return children(data)
  }

  return (
    <Widget>
      {title && (
        <WidgetHeader actions={actions} count={count} icon={icon} subject={subject} title={title} />
      )}
      <WidgetBody disablePadding={disablePadding} scrollable={scrollable}>
        {renderContent()}
      </WidgetBody>
    </Widget>
  )
}
