import type { Meta, StoryObj } from '@storybook/react'
import { Time, TimezoneProvider } from './time'

const meta: Meta<typeof Time> = {
  title: 'UI/Time',
  component: Time,
  argTypes: {
    format: {
      control: 'select',
      options: ['date', 'datetime', 'datetime-tz', 'relative'],
    },
    timezone: { control: 'text' },
  },
  parameters: { layout: 'padded' },
}

export default meta
type Story = StoryObj<typeof Time>

const sampleDate = '2026-04-01T15:30:00Z'
// Fixed past date so the relative-format story renders deterministically.
const recentDate = '2026-04-26T10:25:00Z'

export const DateOnly: Story = {
  args: {
    date: sampleDate,
    format: 'date',
  },
}

export const DateTime: Story = {
  args: {
    date: sampleDate,
    format: 'datetime',
  },
}

export const DateTimeWithTimezone: Story = {
  args: {
    date: sampleDate,
    format: 'datetime-tz',
    timezone: 'America/New_York',
  },
}

export const Relative: Story = {
  args: {
    date: recentDate,
    format: 'relative',
  },
}

export const NullDate: Story = {
  args: {
    date: null,
  },
  render: (args) => (
    <span className="text-sm text-[var(--color-text)]">
      Empty date renders as: <Time {...args} />
    </span>
  ),
}

export const InvalidDate: Story = {
  args: {
    date: 'not-a-date',
  },
  render: (args) => (
    <span className="text-sm text-[var(--color-text)]">
      Invalid date renders as: <Time {...args} />
    </span>
  ),
}

export const WithTimezoneProvider: Story = {
  render: () => (
    <TimezoneProvider value="Asia/Tokyo">
      <div className="flex flex-col gap-2 text-sm text-[var(--color-text)]">
        <span>
          Date: <Time date={sampleDate} format="date" />
        </span>
        <span>
          DateTime: <Time date={sampleDate} format="datetime" />
        </span>
        <span>
          DateTime + tz: <Time date={sampleDate} format="datetime-tz" />
        </span>
      </div>
    </TimezoneProvider>
  ),
}
