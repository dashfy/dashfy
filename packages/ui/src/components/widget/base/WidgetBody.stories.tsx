import type { Meta, StoryObj } from '@storybook/react-vite'

import { Widget } from './Widget'
import { WidgetBody } from './WidgetBody'
import { WidgetHeader } from './WidgetHeader'

const meta = {
  title: 'Widgets/Base/WidgetBody',
  component: WidgetBody,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Content to display in the body',
    },
  },
} satisfies Meta<typeof WidgetBody>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Body content goes here',
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="Widget Title" />
        <WidgetBody {...args} />
      </Widget>
    </div>
  ),
}

export const WithPadding: Story = {
  args: {
    children: (
      <div>
        <p>This is body content with proper padding.</p>
        <p className="mt-2 text-muted-foreground">
          The body provides a container for your widget content.
        </p>
      </div>
    ),
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="Widget with Body" />
        <WidgetBody {...args} />
      </Widget>
    </div>
  ),
}

export const WithList: Story = {
  args: {
    children: (
      <ul className="space-y-2">
        <li className="flex items-center justify-between">
          <span>Item 1</span>
          <span className="text-muted-foreground">Value 1</span>
        </li>
        <li className="flex items-center justify-between">
          <span>Item 2</span>
          <span className="text-muted-foreground">Value 2</span>
        </li>
        <li className="flex items-center justify-between">
          <span>Item 3</span>
          <span className="text-muted-foreground">Value 3</span>
        </li>
      </ul>
    ),
  },
  render: (args) => (
    <div className="h-[300px] w-[400px]">
      <Widget>
        <WidgetHeader title="List Widget" />
        <WidgetBody {...args} />
      </Widget>
    </div>
  ),
}
