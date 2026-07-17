import type { Meta, StoryObj } from '@storybook/react-vite'

import { Widget } from './Widget'

const meta = {
  title: 'Widgets/Base/Widget',
  component: Widget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Content to display inside the widget',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof Widget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Widget Content',
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget {...args} />
    </div>
  ),
}

export const WithCustomContent: Story = {
  args: {
    children: (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h3 className="text-2xl font-bold">Custom Widget</h3>
          <p className="mt-2 text-muted-foreground">This is a custom widget with styled content</p>
        </div>
      </div>
    ),
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget {...args} />
    </div>
  ),
}

export const LargeWidget: Story = {
  args: {
    children: (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Large Widget Container</p>
      </div>
    ),
  },
  render: (args) => (
    <div className="h-[500px] w-[600px]">
      <Widget {...args} />
    </div>
  ),
}

export const SmallWidget: Story = {
  args: {
    children: (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Small</p>
      </div>
    ),
  },
  render: (args) => (
    <div className="h-[150px] w-[200px]">
      <Widget {...args} />
    </div>
  ),
}
