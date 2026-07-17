import { format } from '@dashfy/utils'
import { ActivityIcon } from 'lucide-react'

import { Widget } from '@/components/widget/base/Widget'
import { WidgetBody } from '@/components/widget/base/WidgetBody'
import { WidgetError } from '@/components/widget/base/WidgetError'
import { WidgetHeader } from '@/components/widget/base/WidgetHeader'
import { WidgetLoader } from '@/components/widget/base/WidgetLoader'
import { WidgetListItem } from '@/components/widget/list/WidgetListItem'
import { useApiSubscription } from '@/hooks/useApiSubscription'

interface InspectorData {
  apis: string[]
  clientCount: number
  subscriptions: { id: string; clientCount: number }[]
  uptime: number
  version: string
  nodeVersion: string
}

const DEFAULT_TITLE = 'Dashfy'
const DEFAULT_SUBJECT = 'Inspector'

export const Inspector = () => {
  const { data, error, loading } = useApiSubscription({
    api: 'dashfy',
    endpoint: 'inspector',
  })

  if (loading) {
    return (
      <Widget>
        <WidgetHeader icon={<ActivityIcon />} subject={DEFAULT_SUBJECT} title={DEFAULT_TITLE} />
        <WidgetBody>
          <WidgetLoader />
        </WidgetBody>
      </Widget>
    )
  }

  if (error) {
    return (
      <Widget>
        <WidgetHeader icon={<ActivityIcon />} subject={DEFAULT_SUBJECT} title={DEFAULT_TITLE} />
        <WidgetBody>
          <WidgetError error={error} />
        </WidgetBody>
      </Widget>
    )
  }

  const inspectorData = data as InspectorData

  return (
    <Widget>
      <WidgetHeader
        count={inspectorData?.clientCount}
        icon={<ActivityIcon />}
        subject={DEFAULT_SUBJECT}
        title={DEFAULT_TITLE}
      />
      <WidgetBody disablePadding>
        <WidgetListItem title="APIs" value={inspectorData?.apis.join(', ')} />
        <WidgetListItem title="Clients" value={inspectorData?.clientCount} />
        <WidgetListItem title="Uptime" value={format(inspectorData?.uptime ?? 0, 'time')} />
        <WidgetListItem title="Version" value={inspectorData?.version} />
        <WidgetListItem title="Node" value={inspectorData?.nodeVersion} />
      </WidgetBody>
    </Widget>
  )
}
