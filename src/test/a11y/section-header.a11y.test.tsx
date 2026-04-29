import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { axe } from 'vitest-axe'
import { SectionHeader } from '@/components/ui/section-header'

describe('SectionHeader (a11y)', () => {
  it('has no axe violations with default heading level (h3)', async () => {
    const { container } = render(<SectionHeader>General settings</SectionHeader>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations with actions', async () => {
    const { container } = render(
      <SectionHeader actions={<button type="button">New</button>}>Members</SectionHeader>,
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('has no axe violations when overriding the heading element', async () => {
    const { container } = render(<SectionHeader as="h2">Workspace</SectionHeader>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
