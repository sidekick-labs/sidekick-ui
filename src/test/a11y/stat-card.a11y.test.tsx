import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { Activity } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'

describe('StatCard (a11y)', () => {
  it('has no axe violations with label and value only', async () => {
    const { container } = render(<StatCard label="Active users" value="1,234" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations with description, icon, and trend', async () => {
    const { container } = render(
      <StatCard
        label="Active users"
        value="1,234"
        description="Last 30 days"
        icon={Activity}
        trend={{ value: '12%', direction: 'up' }}
      />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
