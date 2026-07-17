import type { Meta, StoryObj } from '@storybook/react-vite'

import { Widget } from '../base/Widget'
import { WidgetBody } from '../base/WidgetBody'
import { WidgetHeader } from '../base/WidgetHeader'
import { WidgetStatusChip } from './WidgetStatusChip'

const meta = {
  title: 'Widgets/Status/WidgetStatusChip',
  component: WidgetStatusChip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['success', 'warning', 'error', 'info', 'unknown'],
      description: 'Status type',
    },
    label: {
      control: 'text',
      description: 'Chip label text',
    },
    showDot: {
      control: 'boolean',
      description: 'Show status dot indicator',
    },
  },
} satisfies Meta<typeof WidgetStatusChip>

export default meta
type Story = StoryObj<typeof meta>

export const Success: Story = {
  args: {
    status: 'success',
    label: 'Active',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetStatusChip {...args} />
    </div>
  ),
}

export const Warning: Story = {
  args: {
    status: 'warning',
    label: 'Pending',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetStatusChip {...args} />
    </div>
  ),
}

export const Error: Story = {
  args: {
    status: 'error',
    label: 'Failed',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetStatusChip {...args} />
    </div>
  ),
}

export const Info: Story = {
  args: {
    status: 'info',
    label: 'Processing',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetStatusChip {...args} />
    </div>
  ),
}

export const Unknown: Story = {
  args: {
    status: 'unknown',
    label: 'Unknown',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetStatusChip {...args} />
    </div>
  ),
}

export const WithoutDot: Story = {
  args: {
    status: 'success',
    label: 'Completed',
    showDot: false,
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetStatusChip {...args} />
    </div>
  ),
}

export const InWidget: Story = {
  args: {
    status: 'success',
    label: 'Online',
  },
  render: (args) => (
    <div className="w-[400px]">
      <Widget>
        <WidgetHeader title="Server Status" />
        <WidgetBody>
          <div className="flex items-center justify-between">
            <span className="text-sm">Current Status:</span>
            <WidgetStatusChip {...args} />
          </div>
        </WidgetBody>
      </Widget>
    </div>
  ),
}

export const MultipleChips: Story = {
  args: {
    label: 'Service Status',
    status: 'success',
  },
  render: (_args) => (
    <div className="w-[500px]">
      <Widget>
        <WidgetHeader title="Service Health" />
        <WidgetBody>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Server</span>
              <WidgetStatusChip label="Running" status="success" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <WidgetStatusChip label="Connected" status="success" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Cache</span>
              <WidgetStatusChip label="Degraded" status="warning" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Queue</span>
              <WidgetStatusChip label="Offline" status="error" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Worker</span>
              <WidgetStatusChip label="Starting" status="info" />
            </div>
          </div>
        </WidgetBody>
      </Widget>
    </div>
  ),
}

export const ChipGroup: Story = {
  args: {
    label: 'Tag',
    status: 'success',
  },
  render: (_args) => (
    <div className="w-[400px]">
      <Widget>
        <WidgetHeader title="Tags" />
        <WidgetBody>
          <div className="flex flex-wrap gap-2">
            <WidgetStatusChip label="Production" status="success" />
            <WidgetStatusChip label="API v2" status="info" />
            <WidgetStatusChip label="Beta" status="warning" />
            <WidgetStatusChip label="Experimental" status="unknown" />
          </div>
        </WidgetBody>
      </Widget>
    </div>
  ),
}

export const LongLabel: Story = {
  args: {
    status: 'info',
    label: 'This is a longer status label',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetStatusChip {...args} />
    </div>
  ),
}

export const Pulse: Story = {
  args: {
    status: 'success',
    label: 'Online',
    pulse: true,
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetStatusChip {...args} />
    </div>
  ),
}
