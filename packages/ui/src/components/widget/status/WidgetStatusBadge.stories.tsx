import type { Meta, StoryObj } from '@storybook/react-vite'

import { Widget } from '../base/Widget'
import { WidgetBody } from '../base/WidgetBody'
import { WidgetHeader } from '../base/WidgetHeader'
import { WidgetStatusBadge } from './WidgetStatusBadge'

const meta = {
  title: 'Widgets/Status/WidgetStatusBadge',
  component: WidgetStatusBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['success', 'warning', 'error', 'unknown'],
      description: 'Status type',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Badge size',
    },
    label: {
      control: 'text',
      description: 'Optional label text',
    },
  },
} satisfies Meta<typeof WidgetStatusBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Success: Story = {
  args: {
    status: 'success',
    label: 'All Systems Operational',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetStatusBadge {...args} />
    </div>
  ),
}

export const Warning: Story = {
  args: {
    status: 'warning',
    label: 'Degraded Performance',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetStatusBadge {...args} />
    </div>
  ),
}

export const Error: Story = {
  args: {
    status: 'error',
    label: 'Service Unavailable',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetStatusBadge {...args} />
    </div>
  ),
}

export const Unknown: Story = {
  args: {
    status: 'unknown',
    label: 'Status Unknown',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetStatusBadge {...args} />
    </div>
  ),
}

export const WithoutLabel: Story = {
  args: {
    status: 'success',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetStatusBadge {...args} />
    </div>
  ),
}

export const SmallSize: Story = {
  args: {
    status: 'success',
    size: 'sm',
    label: 'Operational',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetStatusBadge {...args} />
    </div>
  ),
}

export const LargeSize: Story = {
  args: {
    status: 'error',
    size: 'lg',
    label: 'Critical Error',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetStatusBadge {...args} />
    </div>
  ),
}

export const InWidget: Story = {
  args: {
    status: 'success',
    label: 'All Systems Operational',
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="System Status" />
        <WidgetBody>
          <div className="flex items-center justify-center">
            <WidgetStatusBadge {...args} />
          </div>
        </WidgetBody>
      </Widget>
    </div>
  ),
}

export const MultipleStatuses: Story = {
  render: () => (
    <div className="w-[500px]">
      <Widget>
        <WidgetHeader title="Service Status" />
        <WidgetBody>
          <div className="grid grid-cols-2 gap-4">
            <WidgetStatusBadge label="API" status="success" />
            <WidgetStatusBadge label="Database" status="success" />
            <WidgetStatusBadge label="Cache" status="warning" />
            <WidgetStatusBadge label="Queue" status="error" />
          </div>
        </WidgetBody>
      </Widget>
    </div>
  ),
}

export const CompactLayout: Story = {
  render: () => (
    <div className="w-[400px]">
      <Widget>
        <WidgetHeader title="Quick Status" />
        <WidgetBody>
          <div className="grid grid-cols-4 gap-2">
            <WidgetStatusBadge size="sm" status="success" />
            <WidgetStatusBadge size="sm" status="success" />
            <WidgetStatusBadge size="sm" status="warning" />
            <WidgetStatusBadge size="sm" status="error" />
          </div>
        </WidgetBody>
      </Widget>
    </div>
  ),
}
