import type { Meta, StoryObj } from '@storybook/react'
import { ProgressBar } from './progress-bar'

const meta: Meta<typeof ProgressBar> = {
  title: 'UI/ProgressBar',
  component: ProgressBar,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger'],
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    value: { control: { type: 'range', min: 0, max: 100 } },
  },
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof ProgressBar>

export const Default: Story = {
  args: {
    value: 60,
    'aria-label': 'Upload progress',
  },
  render: (args) => (
    <div className="w-80">
      <ProgressBar {...args} />
    </div>
  ),
}

export const Empty: Story = {
  args: { value: 0, 'aria-label': 'Empty progress' },
  render: (args) => (
    <div className="w-80">
      <ProgressBar {...args} />
    </div>
  ),
}

export const Complete: Story = {
  args: { value: 100, 'aria-label': 'Completed', variant: 'success' },
  render: (args) => (
    <div className="w-80">
      <ProgressBar {...args} />
    </div>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="w-80 flex flex-col gap-3">
      <ProgressBar value={45} variant="primary" aria-label="Primary" />
      <ProgressBar value={70} variant="success" aria-label="Success" />
      <ProgressBar value={55} variant="warning" aria-label="Warning" />
      <ProgressBar value={30} variant="danger" aria-label="Danger" />
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="w-80 flex flex-col gap-3">
      <ProgressBar value={60} size="sm" aria-label="Small" />
      <ProgressBar value={60} size="md" aria-label="Medium" />
      <ProgressBar value={60} size="lg" aria-label="Large" />
    </div>
  ),
}
