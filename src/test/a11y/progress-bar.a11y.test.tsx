import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { ProgressBar } from '@/components/ui/progress-bar'

describe('ProgressBar (a11y)', () => {
  it('has no axe violations with default props and an aria-label', async () => {
    const { container } = render(<ProgressBar value={40} aria-label="Upload progress" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for the success variant', async () => {
    const { container } = render(
      <ProgressBar value={100} variant="success" aria-label="Sync complete" />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for the danger variant', async () => {
    const { container } = render(
      <ProgressBar value={20} variant="danger" aria-label="Quota usage" />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
