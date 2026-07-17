import type { Meta, StoryObj } from '@storybook/react-vite'

import { Widget } from '../base/Widget'
import { WidgetBody } from '../base/WidgetBody'
import { WidgetHeader } from '../base/WidgetHeader'
import { WidgetAvatar } from './WidgetAvatar'

const meta = {
  title: 'Widgets/Display/WidgetAvatar',
  component: WidgetAvatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: 'Image source URL',
    },
    alt: {
      control: 'text',
      description: 'Alt text for the image',
    },
    size: {
      control: { type: 'number', min: 24, max: 200 },
      description: 'Size of the avatar in pixels',
    },
    children: {
      control: 'text',
      description: 'Fallback text when image is not available',
    },
  },
} satisfies Meta<typeof WidgetAvatar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'JD',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetAvatar {...args} />
    </div>
  ),
}

export const WithImage: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    alt: 'User avatar',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetAvatar {...args} />
    </div>
  ),
}

export const SmallAvatar: Story = {
  args: {
    children: 'AB',
    size: 32,
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetAvatar {...args} />
    </div>
  ),
}

export const LargeAvatar: Story = {
  args: {
    children: 'XY',
    size: 128,
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetAvatar {...args} />
    </div>
  ),
}

export const InWidget: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    alt: 'User profile',
    size: 64,
  },
  render: (args) => (
    <div className="w-[400px]">
      <Widget>
        <WidgetHeader title="User Profile" />
        <WidgetBody>
          <div className="flex items-center gap-4">
            <WidgetAvatar {...args} />
            <div>
              <p className="font-semibold">Jane Doe</p>
              <p className="text-sm text-muted-foreground">Software Engineer</p>
            </div>
          </div>
        </WidgetBody>
      </Widget>
    </div>
  ),
}

export const AvatarList: Story = {
  render: () => (
    <div className="w-[400px]">
      <Widget>
        <WidgetHeader title="Team Members" />
        <WidgetBody>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <WidgetAvatar src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop">
                JD
              </WidgetAvatar>
              <span className="text-sm">John Doe</span>
            </div>
            <div className="flex items-center gap-3">
              <WidgetAvatar src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop">
                JS
              </WidgetAvatar>
              <span className="text-sm">Jane Smith</span>
            </div>
            <div className="flex items-center gap-3">
              <WidgetAvatar>AB</WidgetAvatar>
              <span className="text-sm">Alex Brown</span>
            </div>
          </div>
        </WidgetBody>
      </Widget>
    </div>
  ),
}

export const CustomSize: Story = {
  args: {
    children: 'CS',
    size: '5rem',
  },
  render: (args) => (
    <div className="flex items-center justify-center p-8">
      <WidgetAvatar {...args} />
    </div>
  ),
}
