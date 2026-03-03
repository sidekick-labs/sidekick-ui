import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { createRef } from 'react'
import { Status } from './status'
import type { StatusProps } from './status'

afterEach(cleanup)

describe('Status', () => {
  it('renders with default active variant', () => {
    const { container } = render(<Status>Active</Status>)
    const el = within(container).getByText('Active')
    expect(el).toBeInTheDocument()
    expect(el.className).toContain('text-[var(--color-success)]')
  })

  it('renders each variant with correct color class', () => {
    const expected: Record<string, string> = {
      active: 'text-[var(--color-success)]',
      online: 'text-[var(--color-info)]',
      offline: 'text-[var(--color-text-muted)]',
      completed: 'text-[var(--color-success)]',
      failed: 'text-[var(--color-danger)]',
      cancelled: 'text-[var(--color-text-muted)]',
      processing: 'text-[var(--color-warning)]',
    }

    for (const [variant, colorClass] of Object.entries(expected)) {
      const { container } = render(
        <Status variant={variant as StatusProps['variant']}>{variant}</Status>,
      )
      expect(within(container).getByText(variant).className).toContain(colorClass)
      cleanup()
    }
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLSpanElement>()
    render(<Status ref={ref}>Test</Status>)
    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
  })

  it('merges custom className', () => {
    const { container } = render(<Status className="custom-class">Test</Status>)
    expect(within(container).getByText('Test')).toHaveClass('custom-class')
  })
})
