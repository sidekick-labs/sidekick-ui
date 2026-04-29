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

  // Reviewer asked for "destructive" coverage — Button's destructive-style
  // variant is named `danger` (no `destructive` variant exists in the API).
  it('has no axe violations for the danger variant', async () => {
    const { container } = render(<Button variant="danger">Delete</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for the ghost variant', async () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for the link variant', async () => {
    const { container } = render(<Button variant="link">Link</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
