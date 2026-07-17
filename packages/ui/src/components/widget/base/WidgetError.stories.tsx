import type { Meta, StoryObj } from '@storybook/react-vite'

import { Widget } from './Widget'
import { WidgetError } from './WidgetError'
import { WidgetHeader } from './WidgetHeader'

const meta = {
  title: 'Widgets/Base/WidgetError',
  component: WidgetError,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    error: {
      control: 'text',
      description: 'Error message or Error object',
    },
    onRetry: {
      action: 'retry',
      description: 'Optional retry callback',
    },
  },
} satisfies Meta<typeof WidgetError>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    error: 'Failed to fetch data',
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="Error Widget" />
        <WidgetError {...args} />
      </Widget>
    </div>
  ),
}

export const WithRetry: Story = {
  args: {
    error: 'Network connection failed',
    onRetry: () => console.log('Retry clicked'),
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="Network Error" />
        <WidgetError {...args} />
      </Widget>
    </div>
  ),
}

export const ErrorObject: Story = {
  args: {
    error: new Error('Something went wrong'),
    onRetry: () => console.log('Retry clicked'),
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="Error" />
        <WidgetError {...args} />
      </Widget>
    </div>
  ),
}

export const LongErrorMessage: Story = {
  args: {
    error: 'Unable to connect to the server. Please check your internet connection and try again.',
    onRetry: () => console.log('Retry clicked'),
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="Connection Error" />
        <WidgetError {...args} />
      </Widget>
    </div>
  ),
}

export const WithoutRetry: Story = {
  args: {
    error: 'Access denied',
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="Permission Error" />
        <WidgetError {...args} />
      </Widget>
    </div>
  ),
}

export const FullSize: Story = {
  args: {
    error: 'Failed to load dashboard data',
    onRetry: () => console.log('Retry clicked'),
  },
  render: (args) => (
    <div className="h-[500px] w-[600px]">
      <Widget>
        <WidgetError {...args} />
      </Widget>
    </div>
  ),
}
