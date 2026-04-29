import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { Pagination } from '@/components/ui/pagination'

const pagination = {
  page: 2,
  pages: 5,
  count: 50,
  limit: 10,
  from: 11,
  to: 20,
  previous: 1,
  next: 3,
}

describe('Pagination (a11y)', () => {
  it('has no axe violations for the full variant', async () => {
    const { container } = render(<Pagination pagination={pagination} onPageChange={() => {}} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations for the compact variant', async () => {
    const { container } = render(
      <Pagination pagination={pagination} onPageChange={() => {}} variant="compact" />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
