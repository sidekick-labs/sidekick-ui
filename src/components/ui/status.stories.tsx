import type { Meta, StoryObj } from '@storybook/react'
import { Status } from './status'

const meta: Meta<typeof Status> = {
  title: 'UI/Status',
  component: Status,
  argTypes: {
    variant: {
      control: 'select',
      options: ['active', 'online', 'offline', 'completed', 'failed', 'cancelled', 'processing'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Status>

export const Active: Story = {
  args: {
    variant: 'active',
    children: 'Active',
  },
}

export const Online: Story = {
  args: {
    variant: 'online',
    children: 'Online',
  },
}

export const Offline: Story = {
  args: {
    variant: 'offline',
    children: 'Offline',
  },
}

export const Completed: Story = {
  args: {
    variant: 'completed',
    children: 'Completed',
  },
}

export const Failed: Story = {
  args: {
    variant: 'failed',
    children: 'Failed',
  },
}

export const Cancelled: Story = {
  args: {
    variant: 'cancelled',
    children: 'Cancelled',
  },
}

export const Processing: Story = {
  args: {
    variant: 'processing',
    children: 'Processing',
  },
}

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Status variant="active">Active</Status>
      <Status variant="online">Online</Status>
      <Status variant="offline">Offline</Status>
      <Status variant="completed">Completed</Status>
      <Status variant="failed">Failed</Status>
      <Status variant="cancelled">Cancelled</Status>
      <Status variant="processing">Processing</Status>
    </div>
  ),
}
