import type { Meta, StoryObj } from '@storybook/react'
import { fn } from 'storybook/test'
import { Pencil, Trash2, Cpu } from 'lucide-react'
import {
  List,
  ListSection,
  ListItem,
  ListItemTitle,
  ListItemDescription,
  ListItemMeta,
} from './list'

const meta: Meta<typeof List> = {
  title: 'UI/List',
  component: List,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof List>

export const Default: Story = {
  render: () => (
    <List className="w-[480px] border border-[var(--color-border)] rounded-lg">
      <ListItem prefix="A">
        <div className="min-w-0 flex-1">
          <ListItemTitle>Alice Anderson</ListItemTitle>
          <ListItemDescription>alice@example.com</ListItemDescription>
        </div>
      </ListItem>
      <ListItem prefix="B">
        <div className="min-w-0 flex-1">
          <ListItemTitle>Bob Brown</ListItemTitle>
          <ListItemDescription>bob@example.com</ListItemDescription>
        </div>
      </ListItem>
      <ListItem prefix="C">
        <div className="min-w-0 flex-1">
          <ListItemTitle>Carol Cole</ListItemTitle>
          <ListItemDescription>carol@example.com</ListItemDescription>
        </div>
      </ListItem>
    </List>
  ),
}

export const WithSections: Story = {
  render: () => (
    <List className="w-[480px]">
      <ListSection title="Active">
        <ListItem icon={<Cpu className="w-4 h-4" />}>
          <div className="min-w-0 flex-1">
            <ListItemTitle>Device 0001</ListItemTitle>
            <ListItemMeta>SN-001-A · Batch #42</ListItemMeta>
          </div>
        </ListItem>
        <ListItem icon={<Cpu className="w-4 h-4" />}>
          <div className="min-w-0 flex-1">
            <ListItemTitle>Device 0002</ListItemTitle>
            <ListItemMeta>SN-002-A · Batch #42</ListItemMeta>
          </div>
        </ListItem>
      </ListSection>
      <ListSection title="Archived">
        <ListItem icon={<Cpu className="w-4 h-4" />}>
          <div className="min-w-0 flex-1">
            <ListItemTitle>Device 0099</ListItemTitle>
            <ListItemMeta>SN-099-Z · Batch #1</ListItemMeta>
          </div>
        </ListItem>
      </ListSection>
    </List>
  ),
}

export const Collapsible: Story = {
  render: () => (
    <List className="w-[480px]">
      <ListSection collapsible title="Active devices" defaultOpen>
        <ListItem>
          <ListItemTitle>Device 0001</ListItemTitle>
        </ListItem>
        <ListItem>
          <ListItemTitle>Device 0002</ListItemTitle>
        </ListItem>
      </ListSection>
      <ListSection collapsible title="Decommissioned" defaultOpen={false}>
        <ListItem>
          <ListItemTitle>Device 0099</ListItemTitle>
        </ListItem>
      </ListSection>
    </List>
  ),
}

export const WithActions: Story = {
  render: () => (
    <List className="w-[480px] border border-[var(--color-border)] rounded-lg">
      <ListItem
        prefix="A"
        actions={[
          { icon: <Pencil />, label: 'Edit', onClick: fn() },
          { icon: <Trash2 />, label: 'Delete', onClick: fn() },
        ]}
      >
        <div className="min-w-0 flex-1">
          <ListItemTitle>Alice Anderson</ListItemTitle>
          <ListItemDescription>Hover to reveal actions</ListItemDescription>
        </div>
      </ListItem>
      <ListItem
        prefix="B"
        active
        actions={[
          { icon: <Pencil />, label: 'Edit', onClick: fn() },
          { icon: <Trash2 />, label: 'Delete', onClick: fn() },
        ]}
      >
        <div className="min-w-0 flex-1">
          <ListItemTitle>Bob Brown (active)</ListItemTitle>
          <ListItemDescription>Selected row</ListItemDescription>
        </div>
      </ListItem>
    </List>
  ),
}
