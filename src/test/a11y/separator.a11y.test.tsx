import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { Separator } from '@/components/ui/separator'

describe('Separator (a11y)', () => {
  it('has no axe violations with default (decorative, horizontal) props', async () => {
    const { container } = render(<Separator />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for a vertical, semantic separator', async () => {
    const { container } = render(<Separator orientation="vertical" decorative={false} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for a dashed variant', async () => {
    const { container } = render(<Separator dashed />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
