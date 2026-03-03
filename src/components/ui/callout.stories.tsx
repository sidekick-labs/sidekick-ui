import type { Meta, StoryObj } from '@storybook/react'
import { Callout } from './callout'

const meta: Meta<typeof Callout> = {
  title: 'UI/Callout',
  component: Callout,
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'warning', 'success', 'danger', 'note'],
    },
    title: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof Callout>

export const Note: Story = {
  args: {
    variant: 'note',
    title: 'Note',
    children: 'This is a note callout with additional context for the user.',
  },
}

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    children: 'This is an informational callout to highlight helpful details.',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Warning',
    children: 'This action may have unintended consequences. Please proceed with caution.',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Success',
    children: 'The operation completed successfully.',
  },
}

export const Danger: Story = {
  args: {
    variant: 'danger',
    title: 'Error',
    children: 'Something went wrong. Please try again or contact support.',
  },
}

export const WithoutTitle: Story = {
  args: {
    variant: 'info',
    children: 'A callout without a title, showing only the body content.',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Callout variant="note" title="Note">
        This is a note callout for general annotations.
      </Callout>
      <Callout variant="info" title="Information">
        This is an informational callout to highlight helpful details.
      </Callout>
      <Callout variant="warning" title="Warning">
        This action may have unintended consequences.
      </Callout>
      <Callout variant="success" title="Success">
        The operation completed successfully.
      </Callout>
      <Callout variant="danger" title="Error">
        Something went wrong. Please try again.
      </Callout>
    </div>
  ),
}
