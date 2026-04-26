import type { Meta, StoryObj } from '@storybook/react'
import { expect, userEvent, within, waitFor } from 'storybook/test'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './tooltip'
import { Button } from './button'

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  decorators: [
    (Story) => (
      <TooltipProvider delayDuration={0}>
        <Story />
      </TooltipProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>Helpful tooltip text</TooltipContent>
    </Tooltip>
  ),
}

export const OpenInteraction: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button>Focus me</Button>
      </TooltipTrigger>
      <TooltipContent>Tooltip revealed on focus</TooltipContent>
    </Tooltip>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.hover(canvas.getByRole('button', { name: 'Focus me' }))
    await waitFor(() =>
      expect(
        within(document.body).getAllByText('Tooltip revealed on focus').length,
      ).toBeGreaterThan(0),
    )
  },
}

export const SidePlacements: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8 p-8">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Top</Button>
        </TooltipTrigger>
        <TooltipContent side="top">Top tooltip</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Right</Button>
        </TooltipTrigger>
        <TooltipContent side="right">Right tooltip</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Bottom</Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Bottom tooltip</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Left</Button>
        </TooltipTrigger>
        <TooltipContent side="left">Left tooltip</TooltipContent>
      </Tooltip>
    </div>
  ),
}
