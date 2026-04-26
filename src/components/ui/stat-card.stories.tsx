import type { Meta, StoryObj } from '@storybook/react'
import { Activity, Cpu, Users, Zap } from 'lucide-react'
import { StatCard } from './stat-card'

const meta: Meta<typeof StatCard> = {
  title: 'UI/StatCard',
  component: StatCard,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof StatCard>

export const Default: Story = {
  args: {
    label: 'Active devices',
    value: '1,284',
  },
  render: (args) => (
    <div className="w-72">
      <StatCard {...args} />
    </div>
  ),
}

export const WithIcon: Story = {
  args: {
    label: 'Total users',
    value: '24,512',
    icon: Users,
  },
  render: (args) => (
    <div className="w-72">
      <StatCard {...args} />
    </div>
  ),
}

export const WithDescription: Story = {
  args: {
    label: 'Throughput',
    value: '142 req/s',
    description: 'Last 5 minutes',
    icon: Zap,
  },
  render: (args) => (
    <div className="w-72">
      <StatCard {...args} />
    </div>
  ),
}

export const TrendUp: Story = {
  args: {
    label: 'Uptime',
    value: '99.94%',
    icon: Activity,
    trend: { value: '+0.12% from last week', direction: 'up' },
  },
  render: (args) => (
    <div className="w-72">
      <StatCard {...args} />
    </div>
  ),
}

export const TrendDown: Story = {
  args: {
    label: 'Failed builds',
    value: '17',
    icon: Cpu,
    trend: { value: '+5 from last week', direction: 'down' },
  },
  render: (args) => (
    <div className="w-72">
      <StatCard {...args} />
    </div>
  ),
}

export const TrendNeutral: Story = {
  args: {
    label: 'Open issues',
    value: '42',
    trend: { value: 'No change', direction: 'neutral' },
  },
  render: (args) => (
    <div className="w-72">
      <StatCard {...args} />
    </div>
  ),
}
