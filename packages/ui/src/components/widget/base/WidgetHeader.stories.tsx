import type { Meta, StoryObj } from '@storybook/react-vite'
import { ActivityIcon, BellIcon, UserIcon } from 'lucide-react'

import { Widget } from './Widget'
import { WidgetHeader } from './WidgetHeader'

const meta = {
  title: 'Widgets/Base/WidgetHeader',
  component: WidgetHeader,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Header title text',
    },
    subject: {
      control: 'text',
      description: 'Optional subtitle or subject',
    },
  },
} satisfies Meta<typeof WidgetHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Widget Title',
  },
  render: (args) => (
    <div className="w-[400px]">
      <Widget>
        <WidgetHeader {...args} />
      </Widget>
    </div>
  ),
}

export const WithSubject: Story = {
  args: {
    title: 'Widget Title',
    subject: 'Additional Information',
  },
  render: (args) => (
    <div className="w-[400px]">
      <Widget>
        <WidgetHeader {...args} />
      </Widget>
    </div>
  ),
}

export const WithIcon: Story = {
  args: {
    title: 'Activity Monitor',
    icon: <ActivityIcon className="h-5 w-5" />,
  },
  render: (args) => (
    <div className="w-[400px]">
      <Widget>
        <WidgetHeader {...args} />
      </Widget>
    </div>
  ),
}

export const WithIconAndSubject: Story = {
  args: {
    title: 'Notifications',
    subject: '12 unread messages',
    icon: <BellIcon className="h-5 w-5" />,
  },
  render: (args) => (
    <div className="w-[400px]">
      <Widget>
        <WidgetHeader {...args} />
      </Widget>
    </div>
  ),
}

export const LongTitle: Story = {
  args: {
    title: 'This is a very long widget title that might need to wrap or truncate',
    subject: 'With a long subtitle as well to test the layout',
    icon: <UserIcon className="h-5 w-5" />,
  },
  render: (args) => (
    <div className="w-[400px]">
      <Widget>
        <WidgetHeader {...args} />
      </Widget>
    </div>
  ),
}
