import type { Meta, StoryObj } from '@storybook/react'
import { Package, Search, FileText, Users } from 'lucide-react'
import { EmptyState } from './empty-state'
import { Button } from './button'

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
}

export default meta
type Story = StoryObj<typeof EmptyState>

export const Default: Story = {
  args: {
    icon: Package,
    heading: 'No items yet',
    description: 'Get started by creating your first item.',
  },
}

export const WithAction: Story = {
  args: {
    icon: Package,
    heading: 'No items yet',
    description: 'Get started by creating your first item.',
    action: <Button>Create Item</Button>,
  },
}

export const SearchNoResults: Story = {
  args: {
    icon: Search,
    heading: 'No results found',
    description: 'Try adjusting your search or filter criteria.',
  },
}

export const NoDocuments: Story = {
  args: {
    icon: FileText,
    heading: 'No documents',
    description: 'Upload a document to get started.',
    action: <Button variant="outline">Upload Document</Button>,
  },
}

export const NoTeamMembers: Story = {
  args: {
    icon: Users,
    heading: 'No team members',
    description: 'Invite people to collaborate on this project.',
    action: <Button>Invite Members</Button>,
  },
}
