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

  it('renders as an h3 inside the wrapper div', () => {
    const { container } = render(<SectionHeader>Settings</SectionHeader>)
    expect(container.querySelector('h3')).toHaveTextContent('Settings')
  })

  it('applies uppercase tracking styles to h3', () => {
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

  it('forwards ref to the outer div', () => {
    const ref = createRef<HTMLDivElement>()
    render(<SectionHeader ref={ref}>Settings</SectionHeader>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current!.className).toContain('flex')
  })

  it('merges custom className on the outer div', () => {
    const { container } = render(<SectionHeader className="mt-0">Settings</SectionHeader>)
    expect(container.firstChild).toHaveClass('mt-0')
  })

  it('applies headingClassName to the h3 element', () => {
    const { container } = render(<SectionHeader headingClassName="text-lg">Settings</SectionHeader>)
    expect(container.querySelector('h3')).toHaveClass('text-lg')
  })

  it('defaults to h3 heading level', () => {
    const { container } = render(<SectionHeader>Settings</SectionHeader>)
    expect(container.querySelector('h3')).toBeInTheDocument()
    expect(container.querySelector('h2')).not.toBeInTheDocument()
  })

  it('renders custom heading level via as prop', () => {
    const { container } = render(<SectionHeader as="h2">Settings</SectionHeader>)
    expect(container.querySelector('h2')).toHaveTextContent('Settings')
    expect(container.querySelector('h3')).not.toBeInTheDocument()
  })

  it('renders h4 heading level', () => {
    const { container } = render(<SectionHeader as="h4">Sub-section</SectionHeader>)
    expect(container.querySelector('h4')).toHaveTextContent('Sub-section')
  })
})
