import type { Meta, StoryObj } from '@storybook/react'
import { Activity, Cpu, Users, Zap } from 'lucide-react'
import { StatsGrid } from './stats-grid'
import { StatCard } from './stat-card'

const meta: Meta<typeof StatsGrid> = {
  title: 'UI/StatsGrid',
  component: StatsGrid,
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof StatsGrid>

export const Default: Story = {
  render: () => (
    <div className="w-[960px]">
      <StatsGrid>
        <StatCard label="Active devices" value="1,284" icon={Cpu} />
        <StatCard
          label="Throughput"
          value="142 req/s"
          icon={Zap}
          trend={{ value: '+12% from last hour', direction: 'up' }}
        />
        <StatCard label="Total users" value="24,512" icon={Users} />
        <StatCard
          label="Uptime"
          value="99.94%"
          icon={Activity}
          trend={{ value: '+0.12%', direction: 'up' }}
        />
      </StatsGrid>
    </div>
  ),
}

export const TwoCards: Story = {
  render: () => (
    <div className="w-[640px]">
      <StatsGrid>
        <StatCard label="Active devices" value="1,284" icon={Cpu} />
        <StatCard label="Total users" value="24,512" icon={Users} />
      </StatsGrid>
    </div>
  ),
}

export const NarrowColumns: Story = {
  render: () => (
    <div className="w-[640px]">
      <StatsGrid minColumnWidth={140}>
        <StatCard label="A" value="12" />
        <StatCard label="B" value="34" />
        <StatCard label="C" value="56" />
        <StatCard label="D" value="78" />
        <StatCard label="E" value="90" />
      </StatsGrid>
    </div>
  ),
}
