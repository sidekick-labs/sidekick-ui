import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { Blockquote } from '@/components/ui/blockquote'

describe('Blockquote (a11y)', () => {
  it('has no axe violations with default props', async () => {
    const { container } = render(<Blockquote>The only way out is through.</Blockquote>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations with author and source', async () => {
    const { container } = render(
      <Blockquote author="Robert Frost" source="A Servant to Servants">
        The only way out is through.
      </Blockquote>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
