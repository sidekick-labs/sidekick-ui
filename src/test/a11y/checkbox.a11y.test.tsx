import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { Checkbox } from '@/components/ui/checkbox'

describe('Checkbox (a11y)', () => {
  it('has no axe violations with an associated label', async () => {
    // Radix Checkbox renders a <button role="checkbox">. Wrapping it in a
    // <label> is the implicit-association pattern — axe accepts this. React
    // Doctor flags it as a false positive (it does not recognize a button
    // with role="checkbox" as a labelable element).
    const { container } = render(
      <label>
        <Checkbox /> Accept terms
      </label>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations when checked and labelled via aria-label', async () => {
    const { container } = render(<Checkbox aria-label="Accept terms" defaultChecked />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations when disabled', async () => {
    const { container } = render(<Checkbox aria-label="Disabled option" disabled />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
