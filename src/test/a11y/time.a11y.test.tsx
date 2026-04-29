import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { Time } from '@/components/ui/time'

describe('Time (a11y)', () => {
  it('has no axe violations for a date format', async () => {
    const { container } = render(<Time date="2026-04-29T10:00:00Z" format="date" timezone="UTC" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for a datetime format', async () => {
    const { container } = render(
      <Time date="2026-04-29T10:00:00Z" format="datetime" timezone="UTC" />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for a relative format', async () => {
    const { container } = render(<Time date="2026-04-29T10:00:00Z" format="relative" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for a null date fallback', async () => {
    const { container } = render(<Time date={null} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
