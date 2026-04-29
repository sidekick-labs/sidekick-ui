import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { Callout } from '@/components/ui/callout'

describe('Callout (a11y)', () => {
  it('has no axe violations with default (info) variant and a title', async () => {
    const { container } = render(<Callout title="Heads up">Pay attention to this.</Callout>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for the warning variant', async () => {
    const { container } = render(
      <Callout variant="warning" title="Careful">
        This action is irreversible.
      </Callout>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for the danger variant', async () => {
    const { container } = render(
      <Callout variant="danger" title="Error">
        Something went wrong.
      </Callout>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
