import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { createRef } from 'react'
import { Badge } from './badge'

afterEach(cleanup)

describe('Badge', () => {
  it('renders with default primary variant and md size', () => {
    const { container } = render(<Badge>Active</Badge>)
    const el = within(container).getByText('Active')
    expect(el.className).toContain('bg-[var(--color-primary)]')
    expect(el.className).toContain('px-2')
  })

  it('renders each variant', () => {
    const variants = [
      'primary',
      'secondary',
      'accent',
      'info',
      'success',
      'warning',
      'danger',
      'muted',
    ] as const

    for (const variant of variants) {
      const { container } = render(<Badge variant={variant}>{variant}</Badge>)
      expect(within(container).getByText(variant)).toBeInTheDocument()
      cleanup()
    }
  })

  it('renders sm size', () => {
    const { container } = render(<Badge size="sm">Small</Badge>)
    const el = within(container).getByText('Small')
    expect(el.className).toContain('px-1.5')
    expect(el.className).toContain('text-[10px]')
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLSpanElement>()
    render(<Badge ref={ref}>Ref</Badge>)
    expect(ref.current).toBeInstanceOf(HTMLSpanElement)
  })

  it('merges custom className', () => {
    const { container } = render(<Badge className="custom-class">Test</Badge>)
    expect(within(container).getByText('Test')).toHaveClass('custom-class')
  })
})
