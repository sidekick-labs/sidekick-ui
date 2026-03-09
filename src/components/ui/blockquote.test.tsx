import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { createRef } from 'react'
import { Blockquote } from './blockquote'

afterEach(cleanup)

describe('Blockquote', () => {
  it('renders children', () => {
    const { container } = render(<Blockquote>A wise quote</Blockquote>)
    expect(within(container).getByText('A wise quote')).toBeInTheDocument()
  })

  it('renders as a blockquote element', () => {
    const { container } = render(<Blockquote>Quote</Blockquote>)
    expect(container.querySelector('blockquote')).toBeInTheDocument()
  })

  it('renders author in a cite element', () => {
    const { container } = render(<Blockquote author="Jane Doe">Quote</Blockquote>)
    const cite = container.querySelector('cite')
    expect(cite).toHaveTextContent('Jane Doe')
  })

  it('renders source text', () => {
    const { container } = render(<Blockquote source="Some Book">Quote</Blockquote>)
    expect(within(container).getByText('Some Book')).toBeInTheDocument()
  })

  it('renders author and source with separator', () => {
    const { container } = render(
      <Blockquote author="Jane" source="Book">
        Quote
      </Blockquote>,
    )
    const footer = container.querySelector('footer')
    expect(footer).toHaveTextContent('Jane')
    expect(footer).toHaveTextContent('Book')
    expect(footer?.textContent).toContain(' - ')
  })

  it('does not render footer when no author or source', () => {
    const { container } = render(<Blockquote>Just a quote</Blockquote>)
    expect(container.querySelector('footer')).toBeNull()
  })

  it('forwards ref', () => {
    const ref = createRef<HTMLQuoteElement>()
    render(<Blockquote ref={ref}>Quote</Blockquote>)
    expect(ref.current).toBeInstanceOf(HTMLQuoteElement)
  })

  it('merges custom className', () => {
    const { container } = render(<Blockquote className="custom-class">Quote</Blockquote>)
    expect(container.querySelector('blockquote')).toHaveClass('custom-class')
  })
})
