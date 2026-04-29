import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { Badge } from '@/components/ui/badge'

describe('Badge (a11y)', () => {
  it('has no axe violations with default props', async () => {
    const { container } = render(<Badge>New</Badge>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for the success variant', async () => {
    const { container } = render(<Badge variant="success">Success</Badge>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
