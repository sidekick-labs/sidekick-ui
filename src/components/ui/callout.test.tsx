import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { Callout } from './callout'

afterEach(cleanup)

describe('Callout', () => {
  it('renders with default note variant', () => {
    const { container } = render(<Callout>Some note</Callout>)
    expect(within(container).getByText('Some note')).toBeInTheDocument()
  })

  it('renders each variant', () => {
    const variants = ['info', 'warning', 'success', 'danger', 'note'] as const

    for (const variant of variants) {
      const { container } = render(<Callout variant={variant}>{variant}</Callout>)
      expect(within(container).getByText(variant)).toBeInTheDocument()
      cleanup()
    }
  })

  it('renders title when provided', () => {
    const { container } = render(<Callout title="Heads up">Body text</Callout>)
    const view = within(container)
    expect(view.getByText('Heads up')).toBeInTheDocument()
    expect(view.getByText('Body text')).toBeInTheDocument()
  })

  it('omits title element when not provided', () => {
    const { container } = render(<Callout>Body only</Callout>)
    expect(container.querySelector('h4')).toBeNull()
  })

  it('merges custom className', () => {
    const { container } = render(<Callout className="custom-class">Text</Callout>)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
