import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { Popover, PopoverTrigger, PopoverContent } from './popover'
import { Button } from './button'

const meta: Meta<typeof Popover> = {
  title: 'UI/Popover',
  component: Popover,
}

export default meta
type Story = StoryObj<typeof Popover>

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[var(--color-text)]">Dimensions</h4>
          <p className="text-xs text-[var(--color-text-muted)]">
            Set the dimensions for the layer.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  ),
}

export const OpenInteraction: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Reveal</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm text-[var(--color-text)]">Hidden content revealed.</p>
      </PopoverContent>
    </Popover>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Reveal' }))
    await waitFor(() =>
      expect(within(document.body).getByText('Hidden content revealed.')).toBeVisible(),
    )
  },
}

export const WithForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Quick edit</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex flex-col gap-3">
          <label className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Name
            <input
              type="text"
              defaultValue="Acme"
              className="mt-1 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-sm text-[var(--color-text)] normal-case tracking-normal"
            />
          </label>
          <Button size="sm">Save</Button>
        </div>
      </PopoverContent>
    </Popover>
  ),
}
