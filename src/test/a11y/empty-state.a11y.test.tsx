import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { Inbox } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

describe('EmptyState (a11y)', () => {
  it('has no axe violations with heading only', async () => {
    const { container } = render(<EmptyState icon={Inbox} heading="No items yet" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations with description and action', async () => {
    const { container } = render(
      <EmptyState
        icon={Inbox}
        heading="No items yet"
        description="Create your first item to get started."
        action={<button type="button">Create item</button>}
      />,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
