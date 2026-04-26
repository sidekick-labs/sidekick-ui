import type { Meta, StoryObj } from '@storybook/react'
import { Blockquote } from './blockquote'

const meta: Meta<typeof Blockquote> = {
  title: 'UI/Blockquote',
  component: Blockquote,
  argTypes: {
    author: { control: 'text' },
    source: { control: 'text' },
  },
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof Blockquote>

export const Default: Story = {
  args: {
    children: 'Design is not just what it looks like and feels like. Design is how it works.',
  },
}

export const WithAuthor: Story = {
  args: {
    children: 'Design is not just what it looks like and feels like. Design is how it works.',
    author: 'Steve Jobs',
  },
}

export const WithAuthorAndSource: Story = {
  args: {
    children:
      'The best way to predict the future is to invent it. Really, the way to predict the future is not to extrapolate from the past, but to look at the present.',
    author: 'Alan Kay',
    source: '1971',
  },
}
