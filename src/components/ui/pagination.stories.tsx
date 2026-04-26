import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Pagination } from './pagination'

const meta: Meta<typeof Pagination> = {
  title: 'UI/Pagination',
  component: Pagination,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof Pagination>

const middlePage = {
  page: 3,
  pages: 10,
  count: 247,
  limit: 25,
  from: 51,
  to: 75,
  previous: 2,
  next: 4,
}

const firstPage = { ...middlePage, page: 1, from: 1, to: 25, previous: undefined, next: 2 }
const lastPage = { ...middlePage, page: 10, from: 226, to: 247, previous: 9, next: undefined }

export const Default: Story = {
  args: {
    pagination: middlePage,
    onPageChange: fn(),
  },
  render: (args) => (
    <div className="w-[640px] border border-[var(--color-border)] rounded-lg">
      <Pagination {...args} />
    </div>
  ),
}

export const FirstPage: Story = {
  args: {
    pagination: firstPage,
    onPageChange: fn(),
  },
  render: (args) => (
    <div className="w-[640px] border border-[var(--color-border)] rounded-lg">
      <Pagination {...args} />
    </div>
  ),
}

export const LastPage: Story = {
  args: {
    pagination: lastPage,
    onPageChange: fn(),
  },
  render: (args) => (
    <div className="w-[640px] border border-[var(--color-border)] rounded-lg">
      <Pagination {...args} />
    </div>
  ),
}

export const Compact: Story = {
  args: {
    pagination: middlePage,
    variant: 'compact',
    onPageChange: fn(),
  },
  render: (args) => (
    <div className="w-[480px] border border-[var(--color-border)] rounded-lg">
      <Pagination {...args} />
    </div>
  ),
}

export const SinglePage: Story = {
  args: {
    pagination: { page: 1, pages: 1, count: 5, limit: 25, from: 1, to: 5 },
    onPageChange: fn(),
  },
  render: (args) => (
    <div className="w-[640px] text-sm text-[var(--color-text-muted)]">
      <p className="mb-3">When there is only one page, the component renders nothing:</p>
      <div className="border border-dashed border-[var(--color-border)] rounded-lg p-4">
        <Pagination {...args} />
        <span className="italic">(empty)</span>
      </div>
    </div>
  ),
}
