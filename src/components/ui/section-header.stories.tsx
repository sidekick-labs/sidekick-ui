import type { Meta, StoryObj } from '@storybook/react'
import { SectionHeader } from './section-header'
import { Button } from './button'

const meta: Meta<typeof SectionHeader> = {
  title: 'UI/SectionHeader',
  component: SectionHeader,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof SectionHeader>

export const Default: Story = {
  render: () => (
    <div className="w-[480px]">
      <SectionHeader>Recent Activity</SectionHeader>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Section content lives below the header.
      </p>
    </div>
  ),
}

export const WithActions: Story = {
  render: () => (
    <div className="w-[480px]">
      <SectionHeader actions={<Button size="sm">Add</Button>}>Team Members</SectionHeader>
      <p className="text-sm text-[var(--color-text-secondary)]">
        The button on the right uses the `actions` slot.
      </p>
    </div>
  ),
}

export const HeadingLevels: Story = {
  render: () => (
    <div className="w-[480px] flex flex-col gap-6">
      <SectionHeader as="h2">H2 — Top-level section</SectionHeader>
      <SectionHeader as="h3">H3 — Default subsection</SectionHeader>
      <SectionHeader as="h4">H4 — Nested subsection</SectionHeader>
    </div>
  ),
}
