import type { Meta, StoryObj } from '@storybook/react'
import { Separator } from './separator'

const meta: Meta<typeof Separator> = {
  title: 'UI/Separator',
  component: Separator,
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    dashed: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Separator>

export const Horizontal: Story = {
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <div className="text-sm text-[var(--color-text)]">Content above</div>
        <div className="py-3">
          <Story />
        </div>
        <div className="text-sm text-[var(--color-text)]">Content below</div>
      </div>
    ),
  ],
}

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
  decorators: [
    (Story) => (
      <div className="flex items-center gap-3 h-6">
        <span className="text-sm text-[var(--color-text)]">Left</span>
        <Story />
        <span className="text-sm text-[var(--color-text)]">Right</span>
      </div>
    ),
  ],
}

export const Dashed: Story = {
  args: {
    dashed: true,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <div className="text-sm text-[var(--color-text)]">Content above</div>
        <div className="py-3">
          <Story />
        </div>
        <div className="text-sm text-[var(--color-text)]">Content below</div>
      </div>
    ),
  ],
}

export const DashedVertical: Story = {
  args: {
    orientation: 'vertical',
    dashed: true,
  },
  decorators: [
    (Story) => (
      <div className="flex items-center gap-3 h-6">
        <span className="text-sm text-[var(--color-text)]">Left</span>
        <Story />
        <span className="text-sm text-[var(--color-text)]">Right</span>
      </div>
    ),
  ],
}
