import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, within } from '@testing-library/react'
import { createRef } from 'react'
import { SectionHeader } from './section-header'

afterEach(cleanup)

describe('SectionHeader', () => {
  it('renders heading text', () => {
    const { container } = render(<SectionHeader>Settings</SectionHeader>)
    expect(within(container).getByText('Settings')).toBeInTheDocument()
  })

  it('renders as an h3 element', () => {
    const { container } = render(<SectionHeader>Settings</SectionHeader>)
    expect(container.querySelector('h3')).toHaveTextContent('Settings')
  })

  it('applies uppercase tracking styles', () => {
    const { container } = render(<SectionHeader>Settings</SectionHeader>)
    const h3 = container.querySelector('h3')!
    expect(h3.className).toContain('uppercase')
    expect(h3.className).toContain('tracking-wider')
  })

  it('renders actions slot', () => {
    const { container } = render(
      <SectionHeader actions={<button>Add</button>}>Settings</SectionHeader>,
    )
    expect(within(container).getByText('Add')).toBeInTheDocument()
  })

  it('does not render actions wrapper when not provided', () => {
    const { container } = render(<SectionHeader>Settings</SectionHeader>)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.children).toHaveLength(1)
  })

  it('forwards ref to the h3 element', () => {
    const ref = createRef<HTMLHeadingElement>()
    render(<SectionHeader ref={ref}>Settings</SectionHeader>)
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement)
  })

  it('merges custom className on h3', () => {
    const { container } = render(<SectionHeader className="custom-class">Settings</SectionHeader>)
    expect(container.querySelector('h3')).toHaveClass('custom-class')
  })
})
