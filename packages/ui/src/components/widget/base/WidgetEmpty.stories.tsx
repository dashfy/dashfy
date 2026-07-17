import type { Meta, StoryObj } from '@storybook/react-vite'
import { SearchIcon } from 'lucide-react'

import { Widget } from './Widget'
import { WidgetEmpty } from './WidgetEmpty'
import { WidgetHeader } from './WidgetHeader'

const meta = {
  title: 'Widgets/Base/WidgetEmpty',
  component: WidgetEmpty,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
      description: 'Empty state message',
    },
    icon: {
      control: false,
      description: 'Optional custom icon',
    },
  },
} satisfies Meta<typeof WidgetEmpty>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="Empty Widget" />
        <WidgetEmpty {...args} />
      </Widget>
    </div>
  ),
}

export const CustomMessage: Story = {
  args: {
    message: 'No items found',
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="Items" />
        <WidgetEmpty {...args} />
      </Widget>
    </div>
  ),
}

export const CustomIcon: Story = {
  args: {
    message: 'No search results',
    icon: <SearchIcon className="h-8 w-8 text-muted-foreground" />,
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="Search Results" />
        <WidgetEmpty {...args} />
      </Widget>
    </div>
  ),
}

export const LongMessage: Story = {
  args: {
    message:
      'There are no items to display at the moment. Try adjusting your filters or check back later.',
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="Dashboard" />
        <WidgetEmpty {...args} />
      </Widget>
    </div>
  ),
}

export const FullSize: Story = {
  args: {
    message: 'No data available',
  },
  render: (args) => (
    <div className="h-[500px] w-[600px]">
      <Widget>
        <WidgetEmpty {...args} />
      </Widget>
    </div>
  ),
}
