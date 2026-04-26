import type { Meta, StoryObj } from '@storybook/react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs'

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[480px]">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="text-sm text-[var(--color-text-secondary)]">
          High-level summary of this resource lives here.
        </p>
      </TabsContent>
      <TabsContent value="activity">
        <p className="text-sm text-[var(--color-text-secondary)]">
          A log of recent activity for this resource.
        </p>
      </TabsContent>
      <TabsContent value="settings">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Configure preferences for this resource.
        </p>
      </TabsContent>
    </Tabs>
  ),
}

export const WithDisabled: Story = {
  render: () => (
    <Tabs defaultValue="ready" className="w-[480px]">
      <TabsList>
        <TabsTrigger value="ready">Ready</TabsTrigger>
        <TabsTrigger value="pending">Pending</TabsTrigger>
        <TabsTrigger value="locked" disabled>
          Locked
        </TabsTrigger>
      </TabsList>
      <TabsContent value="ready">
        <p className="text-sm text-[var(--color-text-secondary)]">Ready content.</p>
      </TabsContent>
      <TabsContent value="pending">
        <p className="text-sm text-[var(--color-text-secondary)]">Pending content.</p>
      </TabsContent>
      <TabsContent value="locked">
        <p className="text-sm text-[var(--color-text-secondary)]">Locked content.</p>
      </TabsContent>
    </Tabs>
  ),
}

export const ManyTabs: Story = {
  render: () => (
    <Tabs defaultValue="t3" className="w-[640px]">
      <TabsList>
        <TabsTrigger value="t1">Devices</TabsTrigger>
        <TabsTrigger value="t2">Batches</TabsTrigger>
        <TabsTrigger value="t3">Firmware</TabsTrigger>
        <TabsTrigger value="t4">Users</TabsTrigger>
        <TabsTrigger value="t5">Logs</TabsTrigger>
      </TabsList>
      <TabsContent value="t1">Devices content</TabsContent>
      <TabsContent value="t2">Batches content</TabsContent>
      <TabsContent value="t3">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Firmware tab is selected by default.
        </p>
      </TabsContent>
      <TabsContent value="t4">Users content</TabsContent>
      <TabsContent value="t5">Logs content</TabsContent>
    </Tabs>
  ),
}
