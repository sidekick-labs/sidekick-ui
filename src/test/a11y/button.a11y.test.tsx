import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { Button } from '@/components/ui/button'

describe('Button (a11y)', () => {
  it('has no axe violations with default props', async () => {
    const { container } = render(<Button>Click me</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations when disabled', async () => {
    const { container } = render(<Button disabled>Disabled</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for the secondary variant', async () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
