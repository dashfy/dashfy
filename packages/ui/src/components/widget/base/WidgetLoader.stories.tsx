import type { Meta, StoryObj } from '@storybook/react-vite'

import { Widget } from './Widget'
import { WidgetHeader } from './WidgetHeader'
import { WidgetLoader } from './WidgetLoader'

const meta = {
  title: 'Widgets/Base/WidgetLoader',
  component: WidgetLoader,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
      description: 'Optional loading message',
    },
  },
} satisfies Meta<typeof WidgetLoader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="Loading Widget" />
        <WidgetLoader {...args} />
      </Widget>
    </div>
  ),
}

export const WithMessage: Story = {
  args: {
    message: 'Fetching data...',
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="Loading Widget" />
        <WidgetLoader {...args} />
      </Widget>
    </div>
  ),
}

export const CustomMessage: Story = {
  args: {
    message: 'Please wait while we load your dashboard',
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="Dashboard" />
        <WidgetLoader {...args} />
      </Widget>
    </div>
  ),
}

export const FullSize: Story = {
  args: {
    message: 'Loading...',
  },
  render: (args) => (
    <div className="h-[500px] w-[600px]">
      <Widget>
        <WidgetLoader {...args} />
      </Widget>
    </div>
  ),
}
