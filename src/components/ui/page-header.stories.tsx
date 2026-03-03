import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { PageHeader } from './page-header'
import { Button } from './button'

const meta: Meta<typeof PageHeader> = {
  title: 'UI/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof PageHeader>

export const TitleOnly: Story = {
  args: {
    title: 'Dashboard',
  },
}

export const WithBreadcrumbs: Story = {
  args: {
    breadcrumbs: [
      { label: 'Home', href: '#' },
      { label: 'Devices', href: '#' },
      { label: 'Device Details' },
    ],
  },
}

export const WithTitleAndBreadcrumbs: Story = {
  args: {
    title: 'Device Details',
    breadcrumbs: [
      { label: 'Home', href: '#' },
      { label: 'Devices', href: '#' },
      { label: 'Device Details' },
    ],
  },
}

export const WithActions: Story = {
  render: () => (
    <PageHeader
      title="Firmware Packages"
      actions={
        <div className="flex gap-2">
          <Button variant="ghost">Export</Button>
          <Button>Upload Package</Button>
        </div>
      }
    />
  ),
}

export const WithBackButton: Story = {
  args: {
    title: 'Edit Device',
    showBackButton: true,
    onBackClick: fn(),
  },
}

export const FullExample: Story = {
  args: {
    showBackButton: true,
    onBackClick: fn(),
    breadcrumbs: [
      { label: 'Factory', href: '#' },
      { label: 'Batches', href: '#' },
      { label: 'Batch #42' },
    ],
  },
  render: (args) => (
    <PageHeader
      {...args}
      actions={
        <div className="flex gap-2">
          <Button variant="ghost">Cancel</Button>
          <Button>Save</Button>
        </div>
      }
    />
  ),
}
