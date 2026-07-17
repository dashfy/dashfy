import type { Meta, StoryObj } from '@storybook/react-vite'
import { CheckCircle2Icon, ClockIcon, FileTextIcon, UserIcon } from 'lucide-react'

import { Widget } from '../base/Widget'
import { WidgetHeader } from '../base/WidgetHeader'
import { WidgetListItem } from './WidgetListItem'

const meta = {
  title: 'Widgets/List/WidgetListItem',
  component: WidgetListItem,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Main title text',
    },
    meta: {
      control: 'text',
      description: 'Optional metadata text',
    },
    value: {
      control: 'text',
      description: 'Optional value on the right',
    },
  },
} satisfies Meta<typeof WidgetListItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'List Item Title',
  },
  render: (args) => (
    <div className="w-[400px]">
      <Widget>
        <WidgetListItem {...args} />
      </Widget>
    </div>
  ),
}

export const WithValue: Story = {
  args: {
    title: 'Active Users',
    value: '1,234',
  },
  render: (args) => (
    <div className="w-[400px]">
      <Widget>
        <WidgetListItem {...args} />
      </Widget>
    </div>
  ),
}

export const WithMeta: Story = {
  args: {
    title: 'Database Query',
    meta: 'Last updated 5 minutes ago',
    value: '245ms',
  },
  render: (args) => (
    <div className="w-[400px]">
      <Widget>
        <WidgetListItem {...args} />
      </Widget>
    </div>
  ),
}

export const WithIcon: Story = {
  args: {
    title: 'Task Completed',
    meta: 'Updated today',
    value: '100%',
    icon: <CheckCircle2Icon className="h-5 w-5" />,
  },
  render: (args) => (
    <div className="w-[400px]">
      <Widget>
        <WidgetListItem {...args} />
      </Widget>
    </div>
  ),
}

export const List: Story = {
  args: {
    title: 'Activity Feed Item',
  },
  render: (_args) => (
    <div className="w-[500px]">
      <Widget>
        <WidgetHeader title="Activity Feed" />
        <div>
          <WidgetListItem
            icon={<UserIcon className="h-5 w-5" />}
            meta="2 minutes ago"
            title="John Doe logged in"
          />
          <WidgetListItem
            icon={<FileTextIcon className="h-5 w-5" />}
            meta="15 minutes ago"
            title="New document created"
          />
          <WidgetListItem
            icon={<CheckCircle2Icon className="h-5 w-5" />}
            meta="1 hour ago"
            title="Task completed"
            value="5/5"
          />
          <WidgetListItem
            icon={<ClockIcon className="h-5 w-5" />}
            meta="3 hours ago"
            title="System backup started"
          />
        </div>
      </Widget>
    </div>
  ),
}

export const MetricsList: Story = {
  args: {
    title: 'Server Metric',
  },
  render: (_args) => (
    <div className="w-[400px]">
      <Widget>
        <WidgetHeader title="Server Metrics" />
        <div>
          <WidgetListItem title="CPU Usage" value="45%" />
          <WidgetListItem title="Memory" value="8.2 GB" />
          <WidgetListItem title="Disk Space" value="124 GB" />
          <WidgetListItem title="Network I/O" value="1.2 MB/s" />
        </div>
      </Widget>
    </div>
  ),
}

export const DetailedList: Story = {
  args: {
    title: 'Transaction Item',
  },
  render: (_args) => (
    <div className="w-[500px]">
      <Widget>
        <WidgetHeader title="Recent Transactions" />
        <div>
          <WidgetListItem meta="Transaction ID: #12345" title="Payment received" value="$125.00" />
          <WidgetListItem
            meta="Transaction ID: #12344"
            title="Subscription renewal"
            value="$29.99"
          />
          <WidgetListItem meta="Transaction ID: #12343" title="Product purchase" value="$89.99" />
          <WidgetListItem meta="Transaction ID: #12342" title="Refund processed" value="-$45.00" />
        </div>
      </Widget>
    </div>
  ),
}

export const LongContent: Story = {
  args: {
    title: 'This is a very long list item title that should truncate when it gets too long',
    meta: 'This is also a long metadata text that should truncate appropriately',
    value: '$1,234,567.89',
  },
  render: (args) => (
    <div className="w-[400px]">
      <Widget>
        <WidgetListItem {...args} />
      </Widget>
    </div>
  ),
}
