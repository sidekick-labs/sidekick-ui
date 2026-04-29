import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { Status } from '@/components/ui/status'

describe('Status (a11y)', () => {
  it('has no axe violations with default (active) variant', async () => {
    const { container } = render(<Status>Active</Status>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for the failed variant', async () => {
    const { container } = render(<Status variant="failed">Failed</Status>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for the processing variant', async () => {
    const { container } = render(<Status variant="processing">Processing</Status>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
