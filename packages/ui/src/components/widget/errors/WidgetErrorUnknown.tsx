import { AlertTriangleIcon } from '@/components/common/Icons'
import { Widget } from '@/components/widget/base/Widget'
import { WidgetBody } from '@/components/widget/base/WidgetBody'
import { WidgetHeader } from '@/components/widget/base/WidgetHeader'

export interface WidgetErrorUnknown {
  extension: string
  widget: string
}

export const WidgetErrorUnknown = ({ extension, widget }: WidgetErrorUnknown) => {
  return (
    <Widget>
      <WidgetHeader icon={<AlertTriangleIcon className="h-4 w-4" />} title="Error" />
      <WidgetBody>
        <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-center">
          <AlertTriangleIcon className="h-12 w-12 text-warning" />
          <div>
            <p className="mb-2 text-sm font-medium">Unknown widget type</p>
            <p className="mb-1 text-xs text-muted-foreground">
              Widget &quot;<span className="font-mono">{widget}</span>&quot; for extension &quot;
              <span className="font-mono">{extension}</span>&quot; not found.
            </p>
            <p className="text-xs text-muted-foreground">
              Make sure you&apos;ve installed the corresponding package (
              <span className="font-mono">dashfy-ext-{extension}</span>) and registered the widget.
            </p>
          </div>
        </div>
      </WidgetBody>
    </Widget>
  )
}
