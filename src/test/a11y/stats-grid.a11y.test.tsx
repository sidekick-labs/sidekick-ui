import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { StatCard } from '@/components/ui/stat-card'
import { StatsGrid } from '@/components/ui/stats-grid'

describe('StatsGrid (a11y)', () => {
  it('has no axe violations when wrapping multiple stat cards', async () => {
    const { container } = render(
      <StatsGrid>
        <StatCard label="Users" value="1,234" />
        <StatCard label="Revenue" value="$12,345" />
        <StatCard label="Errors" value="3" />
      </StatsGrid>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
