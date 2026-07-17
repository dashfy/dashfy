import type { Meta, StoryObj } from '@storybook/react-vite'

import { Widget } from '../base/Widget'
import { WidgetHeader } from '../base/WidgetHeader'
import { WidgetCounter } from './WidgetCounter'

const meta = {
  title: 'Widgets/Display/WidgetCounter',
  component: WidgetCounter,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    count: {
      control: { type: 'number', min: 0, max: 999999 },
      description: 'The number to display',
    },
    unit: {
      control: 'text',
      description: 'Optional unit label (e.g., "users", "ms", "%")',
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description: 'Text alignment',
    },
    preLabel: {
      control: 'text',
      description: 'Label displayed above the counter',
    },
    postLabel: {
      control: 'text',
      description: 'Label displayed below the counter',
    },
  },
} satisfies Meta<typeof WidgetCounter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    count: 42,
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="Counter Widget" />
        <WidgetCounter {...args} />
      </Widget>
    </div>
  ),
}

export const WithUnit: Story = {
  args: {
    count: 1234,
    unit: 'users',
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="Active Users" />
        <WidgetCounter {...args} />
      </Widget>
    </div>
  ),
}

export const WithLabels: Story = {
  args: {
    count: 98.5,
    unit: '%',
    preLabel: 'System Uptime',
    postLabel: 'Last 30 days',
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetCounter {...args} />
      </Widget>
    </div>
  ),
}

export const LeftAligned: Story = {
  args: {
    count: 5678,
    unit: 'ms',
    align: 'left',
    preLabel: 'Response Time',
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetCounter {...args} />
      </Widget>
    </div>
  ),
}

export const RightAligned: Story = {
  args: {
    count: 999,
    unit: 'tasks',
    align: 'right',
    postLabel: 'Completed this month',
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetCounter {...args} />
      </Widget>
    </div>
  ),
}

export const LargeNumber: Story = {
  args: {
    count: 1234567,
    preLabel: 'Total Downloads',
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetCounter {...args} />
      </Widget>
    </div>
  ),
}

export const SmallNumber: Story = {
  args: {
    count: 7,
    unit: 'alerts',
    preLabel: 'Critical Issues',
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetCounter {...args} />
      </Widget>
    </div>
  ),
}

export const Percentage: Story = {
  args: {
    count: 87,
    unit: '%',
    preLabel: 'CPU Usage',
    postLabel: 'Current',
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetCounter {...args} />
      </Widget>
    </div>
  ),
}
