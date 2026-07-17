import type { Meta, StoryObj } from '@storybook/react-vite'

import { Widget } from '../base/Widget'
import { WidgetBody } from '../base/WidgetBody'
import { WidgetHeader } from '../base/WidgetHeader'
import { WidgetLabel } from './WidgetLabel'

const meta = {
  title: 'Widgets/Display/WidgetLabel',
  component: WidgetLabel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Label content',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof WidgetLabel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    label: 'Status Label',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetLabel {...args} />
    </div>
  ),
}

export const InWidget: Story = {
  args: {
    label: 'Active',
  },
  render: (args) => (
    <div className="w-[400px]">
      <Widget>
        <WidgetHeader title="System Status" />
        <WidgetBody>
          <div className="flex items-center justify-between">
            <span>Current Status:</span>
            <WidgetLabel {...args} />
          </div>
        </WidgetBody>
      </Widget>
    </div>
  ),
}

export const MultipleLabels: Story = {
  args: {
    label: 'Online',
  },
  render: (_args) => (
    <div className="w-[400px]">
      <Widget>
        <WidgetHeader title="Metrics" />
        <WidgetBody>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Status:</span>
              <WidgetLabel label="Online" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Environment:</span>
              <WidgetLabel label="Production" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Region:</span>
              <WidgetLabel label="US-East" />
            </div>
          </div>
        </WidgetBody>
      </Widget>
    </div>
  ),
}

export const LongLabel: Story = {
  args: {
    label: 'This is a very long label that might need to wrap or truncate',
  },
  render: (args) => (
    <div className="w-[300px]">
      <Widget>
        <WidgetBody>
          <WidgetLabel {...args} />
        </WidgetBody>
      </Widget>
    </div>
  ),
}
