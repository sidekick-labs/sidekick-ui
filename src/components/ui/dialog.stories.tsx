import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from './dialog'
import { Button } from './button'

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
}

export default meta
type Story = StoryObj<typeof Dialog>

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            This is a description of the dialog content. It provides context for the user.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-sm text-[var(--color-text-secondary)]">
          Dialog body content goes here.
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}

export const OpenInteraction: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>Driven by a play function for interaction tests.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const trigger = canvas.getByRole('button', { name: 'Open Dialog' })
    await userEvent.click(trigger)
    // Radix Dialog renders into a portal under document.body.
    const dialog = await waitFor(() => within(document.body).getByRole('dialog'))
    await expect(dialog).toBeInTheDocument()
    await expect(within(document.body).getByText('Dialog Title')).toBeVisible()
  },
}

export const DestructiveAction: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="danger">Delete Item</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the item and all associated
            data.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button variant="danger">Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Open the destructive dialog
    await userEvent.click(canvas.getByRole('button', { name: 'Delete Item' }))
    const body = within(document.body)
    await waitFor(() => body.getByRole('dialog'))
    await expect(body.getByText('Are you sure?')).toBeVisible()
    // Cancel closes the dialog
    await userEvent.click(body.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument())
  },
}

export const WithForm: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Edit Profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Make changes to your profile details below.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <label className="flex flex-col gap-1 text-sm text-[var(--color-text)]">
            Name
            <input
              type="text"
              defaultValue="John Doe"
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-[var(--color-text)]">
            Email
            <input
              type="email"
              defaultValue="john@example.com"
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)]"
            />
          </label>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
